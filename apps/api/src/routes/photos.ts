import { Readable } from 'node:stream'
import { Hono } from 'hono'
import sharp from 'sharp'
import { getAccessToken, getDrive, getDriveFolderId } from '../lib/drive.js'

const MAX_BYTES = 40 * 1024 * 1024
const MAX_MB = MAX_BYTES / (1024 * 1024)
const THUMB_WIDTH = 480
const THUMB_CACHE_MAX = 80

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/heic-sequence',
  'image/heif-sequence',
])

type ThumbCacheEntry = { body: Buffer; mime: string; at: number }
const thumbCache = new Map<string, ThumbCacheEntry>()

function looksLikeImage(file: File): boolean {
  if (ALLOWED_TYPES.has(file.type)) return true
  if (!file.type) {
    return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)
  }
  return file.type.startsWith('image/')
}

function rememberThumb(key: string, entry: ThumbCacheEntry) {
  thumbCache.set(key, entry)
  if (thumbCache.size <= THUMB_CACHE_MAX) return
  const oldest = [...thumbCache.entries()].sort((a, b) => a[1].at - b[1].at)[0]
  if (oldest) thumbCache.delete(oldest[0])
}

async function assertInFolder(fileId: string) {
  const drive = getDrive()
  const folderId = getDriveFolderId()
  const meta = await drive.files.get({
    fileId,
    fields: 'id, mimeType, parents, trashed, thumbnailLink',
    supportsAllDrives: true,
  })
  const parents = meta.data.parents ?? []
  if (meta.data.trashed || !parents.includes(folderId)) {
    return null
  }
  return meta
}

async function buildThumbFromOriginal(fileId: string): Promise<{ body: Buffer; mime: string }> {
  const drive = getDrive()
  const media = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' },
  )
  const input = Buffer.from(media.data as ArrayBuffer)
  const body = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer()
  return { body, mime: 'image/webp' }
}

function extensionFor(fileName: string, mimeType: string): string {
  const fromName = fileName.match(/\.[^.]+$/)?.[0]
  if (fromName) return fromName.toLowerCase()
  if (mimeType.includes('png')) return '.png'
  if (mimeType.includes('webp')) return '.webp'
  if (mimeType.includes('gif')) return '.gif'
  if (mimeType.includes('heic') || mimeType.includes('heif')) return '.heic'
  return '.jpg'
}

export const photosRoute = new Hono()

photosRoute.get('/', async (c) => {
  try {
    const drive = getDrive()
    const folderId = getDriveFolderId()

    const listed = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
      fields: 'files(id, name, mimeType, createdTime, appProperties)',
      orderBy: 'createdTime desc',
      pageSize: 60,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })

    const photos = (listed.data.files ?? [])
      .filter((file): file is typeof file & { id: string } => Boolean(file.id))
      .map((file) => ({
        id: file.id,
        name: file.name ?? 'foto',
        mimeType: file.mimeType ?? 'image/jpeg',
        createdAt: file.createdTime ?? null,
        uploadedBy: file.appProperties?.uploadedBy ?? null,
        url: `/photos/${file.id}/file`,
        thumbUrl: `/photos/${file.id}/thumb`,
      }))

    c.header('Cache-Control', 'public, max-age=30')
    return c.json({ photos })
  } catch (err) {
    console.error(err)
    return c.json(
      {
        error: 'Failed to list photos',
        hint: 'Authorize Drive once at GET /oauth/google if refresh token is missing.',
      },
      500,
    )
  }
})

photosRoute.get('/:id/thumb', async (c) => {
  const fileId = c.req.param('id')
  if (!fileId) return c.json({ error: 'Missing file id' }, 400)

  const cached = thumbCache.get(fileId)
  if (cached) {
    return new Response(new Uint8Array(cached.body), {
      headers: {
        'Content-Type': cached.mime,
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    })
  }

  try {
    const meta = await assertInFolder(fileId)
    if (!meta) return c.json({ error: 'Not found' }, 404)

    // Prefer Google's lightweight thumbnail (avoids downloading full originals)
    const token = await getAccessToken()
    const thumbCandidates = [
      meta.data.thumbnailLink?.replace(/=s\d+/, `=s${THUMB_WIDTH}`),
      `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${THUMB_WIDTH}`,
    ].filter((u): u is string => Boolean(u))

    for (const thumbLink of thumbCandidates) {
      const remote = await fetch(thumbLink, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!remote.ok) continue
      const bytes = Buffer.from(await remote.arrayBuffer())
      if (bytes.length < 32) continue
      const mime = remote.headers.get('content-type') ?? 'image/jpeg'
      rememberThumb(fileId, { body: bytes, mime, at: Date.now() })
      return new Response(bytes, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=604800, immutable',
        },
      })
    }

    // Last resort: resize original once, then serve from memory cache
    const generated = await buildThumbFromOriginal(fileId)
    rememberThumb(fileId, { body: generated.body, mime: generated.mime, at: Date.now() })
    return new Response(new Uint8Array(generated.body), {
      headers: {
        'Content-Type': generated.mime,
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Failed to fetch thumbnail' }, 500)
  }
})

photosRoute.get('/:id/file', async (c) => {
  const fileId = c.req.param('id')
  if (!fileId) return c.json({ error: 'Missing file id' }, 400)

  try {
    const meta = await assertInFolder(fileId)
    if (!meta) return c.json({ error: 'Not found' }, 404)

    const drive = getDrive()
    const media = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' },
    )

    const webStream = Readable.toWeb(media.data as Readable) as unknown as ReadableStream
    return new Response(webStream, {
      headers: {
        'Content-Type': meta.data.mimeType ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Failed to fetch photo' }, 500)
  }
})

photosRoute.post('/', async (c) => {
  try {
    const body = await c.req.parseBody({ all: true })
    const file = body.file
    const uploadedByRaw = typeof body.uploadedBy === 'string' ? body.uploadedBy : ''
    const uploadedBy =
      uploadedByRaw
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 40) || null

    if (!(file instanceof File) && !(file instanceof Blob)) {
      return c.json({ error: 'Envie o campo "file" com uma imagem' }, 400)
    }

    const uploadFile = file as File
    if (!looksLikeImage(uploadFile)) {
      return c.json({ error: 'Só são permitidas imagens (JPG, PNG, WEBP, HEIC, GIF)' }, 400)
    }

    const original = Buffer.from(await uploadFile.arrayBuffer())
    if (original.length <= 0) {
      return c.json({ error: 'Arquivo vazio — tente outra foto' }, 400)
    }
    if (original.length > MAX_BYTES) {
      const mb = (original.length / (1024 * 1024)).toFixed(1)
      return c.json(
        { error: `A foto tem ${mb}MB. O limite é ${MAX_MB}MB — escolha uma menor ou comprima.` },
        400,
      )
    }

    // Keep original bytes/quality — speed comes from /thumb in the grid, not upload recompression
    const mimeType = uploadFile.type || 'image/jpeg'
    const drive = getDrive()
    const folderId = getDriveFolderId()
    const baseName = (uploadFile.name || 'foto').replace(/\.[^.]+$/, '')
    const safeName =
      `${baseName}${extensionFor(uploadFile.name || '', mimeType)}`
        .replace(/[^\w.\-() ]+/g, '_')
        .slice(0, 120) || 'foto.jpg'

    const created = await drive.files.create({
      requestBody: {
        name: safeName,
        parents: [folderId],
        appProperties: uploadedBy ? { uploadedBy } : undefined,
      },
      media: {
        mimeType,
        body: Readable.from(original),
      },
      fields: 'id, name, mimeType, createdTime, appProperties',
      supportsAllDrives: true,
    })

    const id = created.data.id
    if (!id) return c.json({ error: 'Upload failed' }, 500)

    return c.json(
      {
        id,
        name: created.data.name ?? safeName,
        mimeType: created.data.mimeType ?? mimeType,
        createdAt: created.data.createdTime ?? null,
        uploadedBy: created.data.appProperties?.uploadedBy ?? uploadedBy,
        url: `/photos/${id}/file`,
        thumbUrl: `/photos/${id}/thumb`,
      },
      201,
    )
  } catch (err) {
    console.error(err)
    return c.json(
      {
        error: 'Failed to upload photo',
        hint: 'Authorize Drive once at GET /oauth/google if refresh token is missing.',
      },
      500,
    )
  }
})

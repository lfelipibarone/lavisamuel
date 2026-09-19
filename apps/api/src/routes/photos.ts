import { Readable } from 'node:stream'
import { Hono } from 'hono'
import { getDrive, getDriveFolderId } from '../lib/drive.js'

const MAX_BYTES = 40 * 1024 * 1024
const MAX_MB = MAX_BYTES / (1024 * 1024)
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

function looksLikeImage(file: File): boolean {
  if (ALLOWED_TYPES.has(file.type)) return true
  // iOS sometimes sends empty MIME type
  if (!file.type) {
    return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)
  }
  return file.type.startsWith('image/')
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
      pageSize: 100,
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
      }))

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

photosRoute.get('/:id/file', async (c) => {
  const fileId = c.req.param('id')
  if (!fileId) return c.json({ error: 'Missing file id' }, 400)

  try {
    const drive = getDrive()
    const folderId = getDriveFolderId()
    const meta = await drive.files.get({
      fileId,
      fields: 'id, mimeType, parents, trashed',
      supportsAllDrives: true,
    })

    const parents = meta.data.parents ?? []
    if (meta.data.trashed || !parents.includes(folderId)) {
      return c.json({ error: 'Not found' }, 404)
    }

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

    const buffer = Buffer.from(await uploadFile.arrayBuffer())
    if (buffer.length <= 0) {
      return c.json({ error: 'Arquivo vazio — tente outra foto' }, 400)
    }
    if (buffer.length > MAX_BYTES) {
      const mb = (buffer.length / (1024 * 1024)).toFixed(1)
      return c.json(
        { error: `A foto tem ${mb}MB. O limite é ${MAX_MB}MB — escolha uma menor ou comprima.` },
        400,
      )
    }

    const drive = getDrive()
    const folderId = getDriveFolderId()
    const safeName =
      (uploadFile.name || 'foto.jpg').replace(/[^\w.\-() ]+/g, '_').slice(0, 120) || 'foto.jpg'
    const mimeType = uploadFile.type || 'application/octet-stream'

    // Upload goes only to Google Drive (uses the owner's storage quota).
    const created = await drive.files.create({
      requestBody: {
        name: safeName,
        parents: [folderId],
        appProperties: uploadedBy ? { uploadedBy } : undefined,
      },
      media: {
        mimeType,
        body: Readable.from(buffer),
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

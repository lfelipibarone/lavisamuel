export function apiBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (import.meta.env.DEV) return '/api'
  return 'http://localhost:3002'
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${apiBaseUrl()}${normalized}`
}

export type GuestPhoto = {
  id: string
  name: string
  mimeType: string
  createdAt: string | null
  uploadedBy: string | null
  url: string
  thumbUrl: string
}

function withAbsoluteUrls(photo: {
  id: string
  name: string
  mimeType: string
  createdAt: string | null
  uploadedBy: string | null
  url: string
  thumbUrl?: string
}): GuestPhoto {
  return {
    ...photo,
    url: apiUrl(photo.url),
    thumbUrl: apiUrl(photo.thumbUrl ?? `/photos/${photo.id}/thumb`),
  }
}

export async function listGuestPhotos(): Promise<GuestPhoto[]> {
  const res = await fetch(apiUrl('/photos'))
  if (!res.ok) throw new Error('Não foi possível carregar as fotos')
  const data = (await res.json()) as { photos: Array<Omit<GuestPhoto, 'url' | 'thumbUrl'> & { url: string; thumbUrl?: string }> }
  return data.photos.map(withAbsoluteUrls)
}

export async function uploadGuestPhoto(file: File, uploadedBy: string): Promise<GuestPhoto> {
  const body = new FormData()
  body.append('file', file)
  if (uploadedBy.trim()) body.append('uploadedBy', uploadedBy.trim())

  const res = await fetch(apiUrl('/photos'), {
    method: 'POST',
    body,
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(err?.error ?? 'Falha no upload')
  }

  const photo = (await res.json()) as Omit<GuestPhoto, 'url' | 'thumbUrl'> & {
    url: string
    thumbUrl?: string
  }
  return withAbsoluteUrls(photo)
}

export const GUEST_PHOTOS_EVENT = 'guest-photos-changed'

export function notifyGuestPhotosChanged() {
  window.dispatchEvent(new Event(GUEST_PHOTOS_EVENT))
}

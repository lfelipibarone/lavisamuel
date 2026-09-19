import { useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  listGuestPhotos,
  notifyGuestPhotosChanged,
  uploadGuestPhoto,
  type GuestPhoto,
} from '../lib/api'
import styles from './PhotoDrive.module.css'

const NAME_KEY = 'lavi-samuel-guest-name'

export function PhotoDrive() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [guestName, setGuestName] = useLocalStorage(NAME_KEY, '')
  const [photos, setPhotos] = useState<GuestPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const next = await listGuestPhotos()
      setPhotos(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao listar fotos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onFilesSelected(files: FileList | null) {
    if (!files?.length) return
    const name = guestName.trim()
    if (name.length < 2) {
      setError('Digite seu nome (mín. 2 caracteres) antes de enviar.')
      return
    }

    setUploading(true)
    setError(null)
    setMessage(null)

    try {
      for (const file of Array.from(files)) {
        await uploadGuestPhoto(file, name)
      }
      setMessage(files.length > 1 ? 'Fotos enviadas!' : 'Foto enviada!')
      notifyGuestPhotosChanged()
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no upload')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={styles.embed}>
      <p className={styles.lead}>
        Envie fotos do casamento (até 40MB). Elas vão para o Drive do casal e aparecem na
        galeria.
      </p>

      <label className={styles.nameField}>
        <span>Seu nome</span>
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Como você quer aparecer"
          maxLength={40}
          autoComplete="name"
        />
      </label>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.upload}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Enviando…' : 'Escolher fotos'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif"
          multiple
          hidden
          onChange={(e) => void onFilesSelected(e.target.files)}
        />
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className={styles.ok} role="status">
          {message}
        </p>
      )}

      <div className={styles.previewHead}>
        <h4>Enviadas agora</h4>
        <button type="button" className={styles.refresh} onClick={() => void refresh()} disabled={loading}>
          Atualizar
        </button>
      </div>

      {loading && photos.length === 0 ? (
        <p className={styles.hint}>Carregando…</p>
      ) : photos.length === 0 ? (
        <p className={styles.hint}>Ainda não há fotos de convidados. Seja o primeiro!</p>
      ) : (
        <ul className={styles.grid}>
          {photos.slice(0, 12).map((photo) => (
            <li key={photo.id}>
              <img src={photo.url} alt={photo.uploadedBy ? `Foto de ${photo.uploadedBy}` : 'Foto do casamento'} />
              {photo.uploadedBy && <span>{photo.uploadedBy}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

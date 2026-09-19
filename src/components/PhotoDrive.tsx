import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
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

  useEffect(() => {
    if (!uploading) return

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [uploading])

  async function onFilesSelected(files: FileList | null) {
    if (!files?.length) return
    const name = guestName.trim()
    if (name.length < 2) {
      setError('Digite seu nome (mín. 2 caracteres) antes de enviar.')
      return
    }

    const list = Array.from(files)
    setUploading(true)
    setProgress({ done: 0, total: list.length })
    setError(null)
    setMessage(null)

    try {
      for (let i = 0; i < list.length; i++) {
        const file = list[i]
        if (!file) continue
        await uploadGuestPhoto(file, name)
        setProgress({ done: i + 1, total: list.length })
      }
      setMessage(list.length > 1 ? 'Fotos enviadas!' : 'Foto enviada!')
      notifyGuestPhotosChanged()
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no upload')
    } finally {
      setUploading(false)
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={styles.embed} aria-busy={uploading}>
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
          disabled={uploading}
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
          disabled={uploading}
          onChange={(e) => void onFilesSelected(e.target.files)}
        />
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {message && !uploading && (
        <p className={styles.ok} role="status">
          {message}
        </p>
      )}

      <div className={styles.previewHead}>
        <h4>Enviadas agora</h4>
        <button
          type="button"
          className={styles.refresh}
          onClick={() => void refresh()}
          disabled={loading || uploading}
        >
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
              <img
                src={photo.url}
                alt={photo.uploadedBy ? `Foto de ${photo.uploadedBy}` : 'Foto do casamento'}
              />
              {photo.uploadedBy && <span>{photo.uploadedBy}</span>}
            </li>
          ))}
        </ul>
      )}

      {uploading &&
        createPortal(
          <div
            className={styles.blocking}
            role="alertdialog"
            aria-modal="true"
            aria-busy="true"
            aria-live="assertive"
            aria-label="Enviando fotos"
          >
            <div className={styles.blockingCard}>
              <span className={styles.spinner} aria-hidden="true" />
              <p className={styles.blockingTitle}>Enviando fotos…</p>
              <p className={styles.blockingHint}>
                Não feche nem saia desta tela até terminar.
              </p>
              {progress && (
                <p className={styles.blockingProgress}>
                  {progress.done} de {progress.total}
                </p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

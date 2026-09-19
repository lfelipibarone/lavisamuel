import { useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  GUEST_NAME_KEY,
  notifyGuestPhotosChanged,
  uploadGuestPhoto,
} from '../lib/api'
import styles from './PhotoDrive.module.css'

export function PhotoDrive() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [guestName, setGuestName] = useLocalStorage(GUEST_NAME_KEY, '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!uploading) return

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
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
    setError(null)
    setMessage(null)

    try {
      for (const file of list) {
        if (!file) continue
        await uploadGuestPhoto(file, name)
      }
      setMessage(list.length > 1 ? 'Fotos enviadas!' : 'Foto enviada!')
      notifyGuestPhotosChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no upload')
    } finally {
      setUploading(false)
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
    </div>
  )
}

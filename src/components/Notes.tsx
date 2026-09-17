import { useState, type FormEvent } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useReveal } from '../hooks/useReveal'
import styles from './Notes.module.css'

type Note = {
  id: string
  name: string
  message: string
  createdAt: number
}

export function Notes() {
  const ref = useReveal<HTMLElement>()
  const [notes, setNotes] = useLocalStorage<Note[]>('lavi-samuel-notes', [])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedMessage = message.trim()
    if (!trimmedName || !trimmedMessage) return

    setNotes([
      {
        id: crypto.randomUUID(),
        name: trimmedName,
        message: trimmedMessage,
        createdAt: Date.now(),
      },
      ...notes,
    ])
    setName('')
    setMessage('')
  }

  function clearAll() {
    setNotes([])
  }

  return (
    <section id="bilhetes" className={`section ${styles.section} reveal`} ref={ref}>
      <div className="section__inner">
        <p className="section__eyebrow">Brincadeira 03</p>
        <h2 className="section__title">Bilhetes para os noivos</h2>
        <p className="section__lead">
          Deixe um recado carinhoso (ou uma zoação afetuosa). Fica guardado só aqui.
        </p>

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.field}>
            <span>Seu nome</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              placeholder="Ex.: Ana"
            />
          </label>
          <label className={styles.field}>
            <span>Mensagem</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={280}
              required
              rows={4}
              placeholder="Que a vida de vocês tenha... "
            />
          </label>
          <button type="submit" className={styles.submit}>
            Enviar bilhete
          </button>
        </form>

        {notes.length > 0 && (
          <>
            <ul className={styles.list}>
              {notes.map((note) => (
                <li key={note.id} className={styles.note}>
                  <p className={styles.noteMessage}>{note.message}</p>
                  <p className={styles.noteMeta}>— {note.name}</p>
                </li>
              ))}
            </ul>
            <button type="button" className={styles.clear} onClick={clearAll}>
              Limpar bilhetes deste navegador
            </button>
          </>
        )}
        <p className="hint">Salvo só neste navegador.</p>
      </div>
    </section>
  )
}

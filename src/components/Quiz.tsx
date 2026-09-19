import { useState } from 'react'
import { quizQuestions, scoreMessage } from '../data/quiz'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { GUEST_NAME_KEY, saveGuestScore } from '../lib/api'
import styles from './Quiz.module.css'

type QuizState = {
  answers: Record<string, number>
  finished: boolean
  submitted?: boolean
}

const initial: QuizState = { answers: {}, finished: false }

export function Quiz() {
  const [guestName, setGuestName] = useLocalStorage(GUEST_NAME_KEY, '')
  const [stored, setStored] = useLocalStorage<QuizState>('lavi-samuel-quiz-v2', initial)
  const [index, setIndex] = useState(() => {
    const answered = Object.keys(stored.answers).length
    return stored.finished ? 0 : Math.min(answered, quizQuestions.length - 1)
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  const question = quizQuestions[index]
  const selected = question ? stored.answers[question.id] : undefined
  const score = quizQuestions.reduce((acc, q) => {
    return stored.answers[q.id] === q.answerIndex ? acc + 1 : acc
  }, 0)

  function pick(optionIndex: number) {
    if (!question || stored.finished) return
    setStored({
      ...stored,
      answers: { ...stored.answers, [question.id]: optionIndex },
    })
  }

  async function finishAndSave() {
    const name = guestName.trim()
    if (name.length < 2) {
      setSaveError('Digite seu nome (mín. 2 caracteres) para entrar no ranking.')
      return
    }

    const nextScore = quizQuestions.reduce((acc, q) => {
      return stored.answers[q.id] === q.answerIndex ? acc + 1 : acc
    }, 0)

    const finishedState: QuizState = {
      answers: stored.answers,
      finished: true,
      submitted: false,
    }
    setStored(finishedState)
    setSaving(true)
    setSaveError(null)
    setSaveOk(false)
    try {
      await saveGuestScore({
        name,
        game: 'QUIZ',
        score: nextScore,
        maxScore: quizQuestions.length,
      })
      setStored({ ...finishedState, submitted: true })
      setSaveOk(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Falha ao salvar no ranking')
    } finally {
      setSaving(false)
    }
  }

  function next() {
    if (selected == null) return
    if (index >= quizQuestions.length - 1) {
      void finishAndSave()
      return
    }
    setIndex((i) => i + 1)
  }

  function restart() {
    setStored(initial)
    setIndex(0)
    setSaveError(null)
    setSaveOk(false)
  }

  return (
    <div className={styles.embed}>
      <p className={styles.embedLead}>
        Responda com o coração. Seu melhor placar entra no ranking dos convidados.
      </p>

      <label className={styles.nameField}>
        <span>Seu nome</span>
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Como você aparece no ranking"
          maxLength={40}
          autoComplete="name"
          disabled={stored.finished || saving}
        />
      </label>

      {stored.finished ? (
        <div className={styles.result}>
          <p className={styles.score}>
            {score}
            <span>/{quizQuestions.length}</span>
          </p>
          <p className={styles.message}>{scoreMessage(score, quizQuestions.length)}</p>
          {saveOk && <p className={styles.saveOk}>Placar salvo no ranking!</p>}
          {saveError && (
            <p className={styles.saveError} role="alert">
              {saveError}
            </p>
          )}
          {saveError && !stored.submitted && (
            <button
              type="button"
              className={styles.button}
              disabled={saving}
              onClick={() => void finishAndSave()}
            >
              {saving ? 'Salvando…' : 'Salvar no ranking'}
            </button>
          )}
          <button type="button" className={styles.button} onClick={restart} disabled={saving}>
            Refazer quiz
          </button>
        </div>
      ) : question ? (
        <div className={styles.card}>
          <div className={styles.progress}>
            Pergunta {index + 1} de {quizQuestions.length}
          </div>
          <h3 className={styles.prompt}>{question.prompt}</h3>
          <div className={styles.options}>
            {question.options.map((option, i) => (
              <button
                key={option}
                type="button"
                className={`${styles.option} ${selected === i ? styles.selected : ''}`}
                onClick={() => pick(i)}
              >
                {option}
              </button>
            ))}
          </div>
          {saveError && (
            <p className={styles.saveError} role="alert">
              {saveError}
            </p>
          )}
          <button
            type="button"
            className={styles.button}
            onClick={next}
            disabled={selected == null || saving}
          >
            {index >= quizQuestions.length - 1
              ? saving
                ? 'Salvando…'
                : 'Ver resultado'
              : 'Próxima'}
          </button>
        </div>
      ) : null}
    </div>
  )
}

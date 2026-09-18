import { useState } from 'react'
import { quizQuestions, scoreMessage } from '../data/quiz'
import { useLocalStorage } from '../hooks/useLocalStorage'
import styles from './Quiz.module.css'

type QuizState = {
  answers: Record<string, number>
  finished: boolean
}

const initial: QuizState = { answers: {}, finished: false }

export function Quiz() {
  const [stored, setStored] = useLocalStorage<QuizState>('lavi-samuel-quiz-v2', initial)
  const [index, setIndex] = useState(() => {
    const answered = Object.keys(stored.answers).length
    return stored.finished ? 0 : Math.min(answered, quizQuestions.length - 1)
  })

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

  function next() {
    if (selected == null) return
    if (index >= quizQuestions.length - 1) {
      setStored({ ...stored, finished: true })
      return
    }
    setIndex((i) => i + 1)
  }

  function restart() {
    setStored(initial)
    setIndex(0)
  }

  return (
    <div className={styles.embed}>
      <p className={styles.embedLead}>
        Responda com o coração. O placar fica só neste navegador.
      </p>

      {stored.finished ? (
        <div className={styles.result}>
          <p className={styles.score}>
            {score}
            <span>/{quizQuestions.length}</span>
          </p>
          <p className={styles.message}>{scoreMessage(score, quizQuestions.length)}</p>
          <button type="button" className={styles.button} onClick={restart}>
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
          <button
            type="button"
            className={styles.button}
            onClick={next}
            disabled={selected == null}
          >
            {index >= quizQuestions.length - 1 ? 'Ver resultado' : 'Próxima'}
          </button>
        </div>
      ) : null}
    </div>
  )
}

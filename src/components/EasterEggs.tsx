import { useState } from 'react'
import { randomPhrase } from '../data/phrases'
import { useReveal } from '../hooks/useReveal'
import { fireConfetti } from '../lib/confetti'
import { Countdown } from './Countdown'
import styles from './EasterEggs.module.css'

type Props = {
  toast: string | null
  setToast: (value: string | null) => void
}

export function EasterEggs({ toast, setToast }: Props) {
  const ref = useReveal<HTMLElement>()
  const [clicks, setClicks] = useState(0)

  function surprise() {
    const next = randomPhrase(toast ?? undefined)
    setToast(next)
    fireConfetti()
    window.setTimeout(() => setToast(null), 4200)
  }

  function secretTap() {
    const next = clicks + 1
    setClicks(next)
    if (next >= 3) {
      setClicks(0)
      surprise()
    }
  }

  return (
    <section id="surpresas" className={`section ${styles.section} reveal`} ref={ref}>
      <div className="section__inner">
        <p className="section__eyebrow">Brincadeira 05</p>
        <h2 className="section__title">Surpresas</h2>
        <p className="section__lead">
          Clique no & do topo, toque três vezes no ponto abaixo, ou peça uma frase
          aleatória. Confete incluso.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={surprise}>
            Frase surpresa
          </button>
          <button
            type="button"
            className={styles.secret}
            onClick={secretTap}
            aria-label="Ponto secreto"
          />
        </div>

        <div className={styles.timerBlock}>
          <p className={styles.timerLabel}>Ainda faltam</p>
          <Countdown variant="inline" />
        </div>
      </div>
    </section>
  )
}

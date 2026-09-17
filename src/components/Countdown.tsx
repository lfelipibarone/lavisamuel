import { useEffect, useRef } from 'react'
import { useCountdown } from '../hooks/useCountdown'
import { fireConfetti } from '../lib/confetti'
import styles from './Countdown.module.css'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

type Props = {
  variant?: 'hero' | 'inline'
  onDone?: () => void
}

export function Countdown({ variant = 'hero', onDone }: Props) {
  const parts = useCountdown()
  const fired = useRef(false)

  useEffect(() => {
    if (parts.isDone && !fired.current) {
      fired.current = true
      fireConfetti()
      onDone?.()
    }
  }, [parts.isDone, onDone])

  if (parts.isDone) {
    return (
      <div className={`${styles.wrap} ${styles[variant]} ${styles.done}`} aria-live="polite">
        <p className={styles.doneTitle}>É hoje.</p>
        <p className={styles.doneText}>Lavi & Samuel — o cronômetro virou celebração.</p>
      </div>
    )
  }

  const units = [
    { label: 'dias', value: parts.days },
    { label: 'horas', value: pad(parts.hours) },
    { label: 'min', value: pad(parts.minutes) },
    { label: 'seg', value: pad(parts.seconds) },
  ]

  return (
    <div className={`${styles.wrap} ${styles[variant]}`} aria-live="polite">
      <ul className={styles.grid}>
        {units.map((unit) => (
          <li key={unit.label} className={styles.unit}>
            <span className={styles.value}>{unit.value}</span>
            <span className={styles.label}>{unit.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

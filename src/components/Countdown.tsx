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
    if (parts.phase === 'weddingDay' && !fired.current) {
      fired.current = true
      fireConfetti()
      onDone?.()
    }
  }, [parts.phase, onDone])

  if (parts.phase === 'weddingDay') {
    return (
      <div className={`${styles.wrap} ${styles[variant]} ${styles.done}`} aria-live="polite">
        <p className={styles.doneTitle}>Chegou o grande dia</p>
      </div>
    )
  }

  if (parts.phase === 'after') {
    return (
      <div className={`${styles.wrap} ${styles[variant]} ${styles.done}`} aria-live="polite">
        <p className={styles.doneTitle}>Obrigado a todos!</p>
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

import { HERO_PHOTO } from '../data/gallery'
import { Countdown } from './Countdown'
import styles from './Hero.module.css'

type Props = {
  onAmpersandClick: () => void
}

export function Hero({ onAmpersandClick }: Props) {
  return (
    <header className={styles.hero}>
      <img
        className={styles.bg}
        src={HERO_PHOTO}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
      />
      <div className={styles.veil} />
      <div className={styles.content}>
        <p className={styles.date}>24 · 09 · 2026 · 10h</p>
        <h1 className={styles.brand}>
          Lavi{' '}
          <button
            type="button"
            className={styles.amp}
            onClick={onAmpersandClick}
            aria-label="Surpresa escondida"
            title="?"
          >
            &
          </button>{' '}
          Samuel
        </h1>
        <p className={styles.tagline}>
          Contagem regressiva com carinho, humor e um pouco de confete.
        </p>
        <Countdown variant="hero" />
        <a className={styles.cta} href="#jogos">
          Ir para os mini games
        </a>
      </div>
    </header>
  )
}

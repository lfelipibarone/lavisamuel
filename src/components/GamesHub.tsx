import { useEffect, useId, type ReactNode } from 'react'
import { useReveal } from '../hooks/useReveal'
import styles from './GamesHub.module.css'

export type GameId = 'quiz' | 'bouquet'

type GameTile = {
  id: GameId
  title: string
  blurb: string
  label: string
  image: string
}

const TILES: GameTile[] = [
  {
    id: 'quiz',
    title: 'Quiz do casal',
    blurb: 'Quem conhece melhor Lavi & Samuel?',
    label: '01',
    image: '/photos/VAG_7452-sm.webp',
  },
  {
    id: 'bouquet',
    title: 'Pegue o buquê',
    blurb: 'Mini game Phaser — corre e captura.',
    label: '02',
    image: '/photos/VAG_7335-sm.webp',
  },
]

type Props = {
  active: GameId | null
  onOpen: (id: GameId) => void
  onClose: () => void
  children: ReactNode
}

export function GamesHub({ active, onOpen, onClose, children }: Props) {
  const titleId = useId()
  const sectionRef = useReveal<HTMLElement>()
  const activeTile = TILES.find((t) => t.id === active)

  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [active, onClose])

  return (
    <section id="jogos" className={`section ${styles.section} reveal`} ref={sectionRef}>
      <div className="section__inner">
        <p className="section__eyebrow">Jogos</p>
        <h2 className="section__title">Mini games do casal</h2>
        <p className="section__lead">
          Escolha um quadrado e entre na brincadeira. A página fica leve — o jogo abre por
          cima.
        </p>

        <div className={styles.grid}>
          {TILES.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className={styles.tile}
              onClick={() => onOpen(tile.id)}
            >
              <img
                className={styles.tileImage}
                src={tile.image}
                alt=""
                loading="lazy"
              />
              <span className={styles.tileShade} aria-hidden="true" />
              <span className={styles.tileContent}>
                <span className={styles.tileLabel}>{tile.label}</span>
                <span className={styles.tileTitle}>{tile.title}</span>
                <span className={styles.tileBlurb}>{tile.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {active && activeTile && (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={onClose}
        >
          <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            <header className={styles.panelHead}>
              <div>
                <p className={styles.panelEyebrow}>Mini game {activeTile.label}</p>
                <h3 id={titleId} className={styles.panelTitle}>
                  {activeTile.title}
                </h3>
              </div>
              <button type="button" className={styles.close} onClick={onClose}>
                Fechar
              </button>
            </header>
            <div className={styles.panelBody}>{children}</div>
          </div>
        </div>
      )}
    </section>
  )
}

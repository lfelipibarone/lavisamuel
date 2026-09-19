import { useEffect, useId, type ReactNode } from 'react'
import { useReveal } from '../hooks/useReveal'
import styles from './GamesHub.module.css'

export type HubId = 'quiz' | 'bouquet' | 'album' | 'ranking'

type HubTile = {
  id: HubId
  title: string
  blurb: string
  label: string
  image: string
  kind: 'game' | 'album' | 'ranking'
}

const TILES: HubTile[] = [
  {
    id: 'quiz',
    title: 'Quiz do casal',
    blurb: 'Quem conhece melhor Lavi & Samuel?',
    label: '01',
    image: '/photos/VAG_7452-sm.webp',
    kind: 'game',
  },
  {
    id: 'bouquet',
    title: 'Pegue o buquê',
    blurb: 'Errou uma vez — acabou. Quantos seguidos?',
    label: '02',
    image: '/photos/VAG_7335-sm.webp',
    kind: 'game',
  },
  {
    id: 'album',
    title: 'Álbum dos convidados',
    blurb: 'Envie fotos — vão para o Drive e a galeria.',
    label: '03',
    image: '/photos/VAG_7404-sm.webp',
    kind: 'album',
  },
  {
    id: 'ranking',
    title: 'Ranking dos convidados',
    blurb: 'Melhores placares do quiz e do buquê.',
    label: '04',
    image: '/photos/VAG_7637-sm.webp',
    kind: 'ranking',
  },
]

type Props = {
  active: HubId | null
  onOpen: (id: HubId) => void
  onClose: () => void
  children: ReactNode
}

function kindLabel(kind: HubTile['kind']) {
  if (kind === 'album') return 'Álbum'
  if (kind === 'ranking') return 'Ranking'
  return 'Mini game'
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
        <p className="section__eyebrow">Jogos & álbum</p>
        <h2 className="section__title">Mini games e fotos</h2>
        <p className="section__lead">
          Jogue, envie fotos do dia e veja o ranking dos convidados.
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
                <p className={styles.panelEyebrow}>
                  {kindLabel(activeTile.kind)} {activeTile.label}
                </p>
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

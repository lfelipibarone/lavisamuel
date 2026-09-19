import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { fireConfetti } from '../lib/confetti'
import styles from './BouquetGame.module.css'

const BEST_KEY = 'lavi-samuel-bouquet-best'
const PORTRAIT_MOBILE = '(max-width: 900px) and (orientation: portrait)'

type Props = {
  layout?: 'embed' | 'fullscreen'
  onClose?: () => void
}

export function BouquetGame({ layout = 'embed', onClose }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [started, setStarted] = useState(false)
  const [bestScore, setBestScore] = useLocalStorage<number>(BEST_KEY, 0)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const needsRotate = useMediaQuery(PORTRAIT_MOBILE)
  const isFullscreen = layout === 'fullscreen'

  useEffect(() => {
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isFullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [isFullscreen, onClose])

  useEffect(() => {
    if (needsRotate) return
    gameRef.current?.scale.refresh()
  }, [needsRotate, isFullscreen])

  async function startGame() {
    if (needsRotate || !hostRef.current || gameRef.current) return
    setStarted(true)
    setLastScore(null)

    const { createBouquetGame } = await import('../game/bouquetGame')
    gameRef.current = createBouquetGame(hostRef.current, {
      bestScore,
      onFinished: ({ score, best }) => {
        setLastScore(score)
        setBestScore(best)
        if (score >= 5) fireConfetti()
      },
    })
  }

  function playAgain() {
    if (needsRotate) return
    gameRef.current?.destroy(true)
    gameRef.current = null
    if (hostRef.current) hostRef.current.innerHTML = ''
    window.requestAnimationFrame(() => {
      void startGame()
    })
  }

  const stage = (
    <div className={styles.stage}>
      <div ref={hostRef} className={styles.canvasHost} />

      {needsRotate ? (
        <div className={styles.rotate} role="status" aria-live="polite">
          <span className={styles.rotateIcon} aria-hidden="true" />
          <p className={styles.rotateTitle}>Vire o celular</p>
          <p className={styles.rotateHint}>Gire para a horizontal para jogar.</p>
        </div>
      ) : (
        !started && (
          <div className={styles.overlay}>
            <button type="button" className={styles.start} onClick={() => void startGame()}>
              Começar jogo
            </button>
          </div>
        )
      )}
    </div>
  )

  if (isFullscreen) {
    return (
      <div
        className={styles.shell}
        role="dialog"
        aria-modal="true"
        aria-label="Pegue o buquê"
      >
        <div className={styles.shellBar}>
          <div className={styles.shellMeta}>
            <span>Recorde: {bestScore}</span>
            {lastScore != null && <span>Última: {lastScore}</span>}
          </div>
          <div className={styles.shellActions}>
            {started && !needsRotate && (
              <button type="button" className={styles.shellReset} onClick={playAgain}>
                Reiniciar
              </button>
            )}
            {onClose && (
              <button type="button" className={styles.shellClose} onClick={onClose}>
                Fechar
              </button>
            )}
          </div>
        </div>
        {stage}
      </div>
    )
  }

  return (
    <div className={styles.embed}>
      <p className={styles.embedLead}>
        Toque no chão para correr e pegar o buquê. Errou uma vez — acabou. O ranking é
        quantos você segurou seguidos.
      </p>

      <div className={styles.meta}>
        <span>Recorde: {bestScore}</span>
        {lastScore != null && <span>Última: {lastScore}</span>}
      </div>

      {stage}

      {started && !needsRotate && (
        <button type="button" className={styles.reset} onClick={playAgain}>
          Reiniciar
        </button>
      )}
    </div>
  )
}

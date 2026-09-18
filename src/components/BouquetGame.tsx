import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { fireConfetti } from '../lib/confetti'
import styles from './BouquetGame.module.css'

const BEST_KEY = 'lavi-samuel-bouquet-best'
const PORTRAIT_MOBILE = '(max-width: 900px) and (orientation: portrait)'

export function BouquetGame() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [started, setStarted] = useState(false)
  const [bestScore, setBestScore] = useLocalStorage<number>(BEST_KEY, 0)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const needsRotate = useMediaQuery(PORTRAIT_MOBILE)

  useEffect(() => {
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  useEffect(() => {
    if (needsRotate) return
    gameRef.current?.scale.refresh()
  }, [needsRotate])

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
        if (score >= 3) fireConfetti()
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

  return (
    <div className={styles.embed}>
      <p className={styles.embedLead}>
        Toque no chão para correr e pegar o buquê. Cinco rodadas.
      </p>

      <div className={styles.meta}>
        <span>Recorde: {bestScore}/5</span>
        {lastScore != null && <span>Última: {lastScore}/5</span>}
      </div>

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

      {started && !needsRotate && (
        <button type="button" className={styles.reset} onClick={playAgain}>
          Reiniciar
        </button>
      )}
    </div>
  )
}

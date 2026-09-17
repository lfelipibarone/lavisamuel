import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { fireConfetti } from '../lib/confetti'
import styles from './BouquetGame.module.css'

const BEST_KEY = 'lavi-samuel-bouquet-best'

export function BouquetGame() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [started, setStarted] = useState(false)
  const [bestScore, setBestScore] = useLocalStorage<number>(BEST_KEY, 0)
  const [lastScore, setLastScore] = useState<number | null>(null)

  useEffect(() => {
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  async function startGame() {
    if (!hostRef.current || gameRef.current) return
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
        {!started && (
          <div className={styles.overlay}>
            <button type="button" className={styles.start} onClick={() => void startGame()}>
              Começar jogo
            </button>
            <p>Melhor em tela horizontal no celular.</p>
          </div>
        )}
      </div>

      {started && (
        <button type="button" className={styles.reset} onClick={playAgain}>
          Reiniciar
        </button>
      )}
    </div>
  )
}

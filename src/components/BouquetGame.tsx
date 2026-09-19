import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { fireConfetti } from '../lib/confetti'
import { GUEST_NAME_KEY, saveGuestScore } from '../lib/api'
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
  const [guestName, setGuestName] = useLocalStorage(GUEST_NAME_KEY, '')
  const [bestScore, setBestScore] = useLocalStorage<number>(BEST_KEY, 0)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)
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

  async function persistScore(score: number, name: string) {
    if (name.length < 2) {
      setSaveError('Digite seu nome acima para entrar no ranking.')
      setSaveOk(false)
      return
    }
    setSaveError(null)
    try {
      await saveGuestScore({
        name,
        game: 'BOUQUET',
        score,
        maxScore: Math.max(score, 1),
      })
      setSaveOk(true)
    } catch (err) {
      setSaveOk(false)
      setSaveError(err instanceof Error ? err.message : 'Falha ao salvar no ranking')
    }
  }

  async function startGame() {
    if (needsRotate || !hostRef.current || gameRef.current) return
    const name = guestName.trim()
    if (name.length < 2) {
      setSaveError('Digite seu nome (mín. 2 caracteres) antes de jogar.')
      return
    }

    setStarted(true)
    setLastScore(null)
    setSaveError(null)
    setSaveOk(false)

    const { createBouquetGame } = await import('../game/bouquetGame')
    gameRef.current = createBouquetGame(hostRef.current, {
      bestScore,
      onFinished: ({ score, best }) => {
        setLastScore(score)
        setBestScore(best)
        if (score >= 5) fireConfetti()
        void persistScore(score, name)
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

  const nameField = (
    <label className={styles.nameField}>
      <span>Seu nome</span>
      <input
        type="text"
        value={guestName}
        onChange={(e) => setGuestName(e.target.value)}
        placeholder="Como você aparece no ranking"
        maxLength={40}
        autoComplete="name"
        disabled={started && !needsRotate}
      />
    </label>
  )

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
        <div className={styles.shellBody}>
          {nameField}
          {saveError && (
            <p className={styles.saveError} role="alert">
              {saveError}
            </p>
          )}
          {saveOk && lastScore != null && (
            <p className={styles.saveOk}>Placar {lastScore} no ranking!</p>
          )}
          {stage}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.embed}>
      <p className={styles.embedLead}>
        Toque no chão para correr e pegar o buquê. Errou uma vez — acabou. O ranking é
        quantos você segurou seguidos.
      </p>

      {nameField}

      <div className={styles.meta}>
        <span>Recorde: {bestScore}</span>
        {lastScore != null && <span>Última: {lastScore}</span>}
      </div>

      {saveError && (
        <p className={styles.saveError} role="alert">
          {saveError}
        </p>
      )}
      {saveOk && lastScore != null && (
        <p className={styles.saveOk}>Placar {lastScore} no ranking!</p>
      )}

      {stage}

      {started && !needsRotate && (
        <button type="button" className={styles.reset} onClick={playAgain}>
          Reiniciar
        </button>
      )}
    </div>
  )
}

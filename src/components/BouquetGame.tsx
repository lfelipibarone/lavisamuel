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

  const wasPortraitRef = useRef(needsRotate)

  // After rotating from portrait → landscape with a valid name, start the game
  useEffect(() => {
    const cameFromPortrait = wasPortraitRef.current && !needsRotate
    wasPortraitRef.current = needsRotate
    if (!isFullscreen || !cameFromPortrait) return
    if (started || gameRef.current) return
    if (guestName.trim().length < 2) return
    void startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start after rotate only
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
    const name = guestName.trim()
    if (name.length < 2) {
      setSaveError('Digite seu nome (mín. 2 caracteres) antes de jogar.')
      return
    }

    if (needsRotate) {
      setSaveError('Gire o celular para a horizontal e toque em Começar de novo.')
      return
    }

    if (!hostRef.current) {
      setSaveError('Aguarde um instante e toque em Começar de novo.')
      return
    }

    if (gameRef.current) {
      gameRef.current.destroy(true)
      gameRef.current = null
      hostRef.current.innerHTML = ''
    }

    setStarted(true)
    setLastScore(null)
    setSaveError(null)
    setSaveOk(false)

    try {
      const { createBouquetGame } = await import('../game/bouquetGame')
      if (!hostRef.current) return
      gameRef.current = createBouquetGame(hostRef.current, {
        bestScore,
        onFinished: ({ score, best }) => {
          setLastScore(score)
          setBestScore(best)
          if (score >= 5) fireConfetti()
          void persistScore(score, name)
        },
      })
      window.requestAnimationFrame(() => {
        gameRef.current?.scale.refresh()
      })
    } catch (err) {
      setStarted(false)
      setSaveError(err instanceof Error ? err.message : 'Não foi possível iniciar o jogo')
    }
  }

  function playAgain() {
    if (needsRotate) {
      setSaveError('Gire o celular para a horizontal para jogar de novo.')
      return
    }
    gameRef.current?.destroy(true)
    gameRef.current = null
    if (hostRef.current) hostRef.current.innerHTML = ''
    setStarted(false)
    window.requestAnimationFrame(() => {
      void startGame()
    })
  }

  const canStart = guestName.trim().length >= 2
  const showStartCta = !started || needsRotate

  const controls = (
    <div className={styles.controls}>
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
          enterKeyHint="done"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              ;(e.target as HTMLInputElement).blur()
              void startGame()
            }
          }}
        />
      </label>

      {showStartCta && (
        <button
          type="button"
          className={styles.start}
          disabled={!canStart}
          onClick={() => void startGame()}
        >
          {needsRotate ? 'Gire o celular e comece' : 'Começar jogo'}
        </button>
      )}

      {saveError && (
        <p className={styles.saveError} role="alert">
          {saveError}
        </p>
      )}
      {saveOk && lastScore != null && (
        <p className={styles.saveOk}>Placar {lastScore} no ranking!</p>
      )}
    </div>
  )

  const stage = (
    <div className={styles.stage}>
      <div ref={hostRef} className={styles.canvasHost} />

      {needsRotate && (
        <div className={styles.rotate} role="status" aria-live="polite">
          <span className={styles.rotateIcon} aria-hidden="true" />
          <p className={styles.rotateTitle}>Vire o celular</p>
          <p className={styles.rotateHint}>
            Coloque na horizontal, depois toque em Começar.
          </p>
        </div>
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
          {controls}
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

      {controls}

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

import { useState } from 'react'
import { randomPhrase } from './data/phrases'
import { fireConfetti } from './lib/confetti'
import { BouquetGame } from './components/BouquetGame'
import { Gallery } from './components/Gallery'
import { GamesHub, type GameId } from './components/GamesHub'
import { Hero } from './components/Hero'
import { Quiz } from './components/Quiz'
import styles from './App.module.css'

export default function App() {
  const [toast, setToast] = useState<string | null>(null)
  const [activeGame, setActiveGame] = useState<GameId | null>(null)

  function onAmpersandClick() {
    const next = randomPhrase(toast ?? undefined)
    setToast(next)
    fireConfetti()
    window.setTimeout(() => setToast(null), 4200)
  }

  return (
    <div className={styles.app}>
      <Hero onAmpersandClick={onAmpersandClick} />
      <main>
        <GamesHub
          active={activeGame}
          onOpen={setActiveGame}
          onClose={() => setActiveGame(null)}
        >
          {activeGame === 'quiz' && <Quiz />}
          {activeGame === 'bouquet' && <BouquetGame />}
        </GamesHub>
        <Gallery />
      </main>
      <footer className={styles.footer}>
        <p>Lavi & Samuel · 24 de setembro de 2026 · 10h</p>
        <p className={styles.footerNote}>Feito com carinho para a competição do countdown.</p>
      </footer>

      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { randomPhrase } from './data/phrases'
import { fireConfetti } from './lib/confetti'
import { BouquetGame } from './components/BouquetGame'
import { Gallery } from './components/Gallery'
import { GamesHub, type HubId } from './components/GamesHub'
import { Hero } from './components/Hero'
import { LeaderboardPanel } from './components/Leaderboard'
import { PhotoDrive } from './components/PhotoDrive'
import { Quiz } from './components/Quiz'
import { useMediaQuery } from './hooks/useMediaQuery'
import styles from './App.module.css'

export default function App() {
  const [toast, setToast] = useState<string | null>(null)
  const [activeHub, setActiveHub] = useState<HubId | null>(null)
  const isMobile = useMediaQuery('(max-width: 900px)')
  const bouquetFullscreen = activeHub === 'bouquet' && isMobile
  const modalHub = bouquetFullscreen ? null : activeHub

  function onAmpersandClick() {
    const next = randomPhrase(toast ?? undefined)
    setToast(next)
    fireConfetti()
    window.setTimeout(() => setToast(null), 4200)
  }

  function closeHub() {
    setActiveHub(null)
  }

  return (
    <div className={styles.app}>
      <Hero onAmpersandClick={onAmpersandClick} />
      <main>
        <GamesHub active={modalHub} onOpen={setActiveHub} onClose={closeHub}>
          {modalHub === 'quiz' && <Quiz />}
          {modalHub === 'bouquet' && <BouquetGame />}
          {modalHub === 'album' && <PhotoDrive />}
          {modalHub === 'ranking' && <LeaderboardPanel />}
        </GamesHub>
        <Gallery />
      </main>

      {bouquetFullscreen && <BouquetGame layout="fullscreen" onClose={closeHub} />}
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

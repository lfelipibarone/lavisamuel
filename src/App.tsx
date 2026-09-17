import { useState } from 'react'
import { randomPhrase } from './data/phrases'
import { fireConfetti } from './lib/confetti'
import { EasterEggs } from './components/EasterEggs'
import { Gallery } from './components/Gallery'
import { Hero } from './components/Hero'
import { Notes } from './components/Notes'
import { Polls } from './components/Polls'
import { Quiz } from './components/Quiz'
import styles from './App.module.css'

export default function App() {
  const [toast, setToast] = useState<string | null>(null)

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
        <Quiz />
        <Polls />
        <Notes />
        <Gallery />
        <EasterEggs toast={toast} setToast={setToast} />
      </main>
      <footer className={styles.footer}>
        <p>Lavi & Samuel · 24 de setembro de 2026 · 12h</p>
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

import { useEffect, useState } from 'react'
import { fetchLeaderboard, type Leaderboard, type RankEntry } from '../lib/api'
import styles from './Leaderboard.module.css'

function Board({
  title,
  hint,
  entries,
  formatScore,
}: {
  title: string
  hint: string
  entries: RankEntry[]
  formatScore: (entry: RankEntry) => string
}) {
  return (
    <section className={styles.board}>
      <header className={styles.boardHead}>
        <h4>{title}</h4>
        <p>{hint}</p>
      </header>
      {entries.length === 0 ? (
        <p className={styles.empty}>Ainda sem placares. Seja o primeiro!</p>
      ) : (
        <ol className={styles.list}>
          {entries.map((entry) => (
            <li key={`${title}-${entry.rank}-${entry.name}`}>
              <span className={styles.rank}>{entry.rank}</span>
              <span className={styles.name}>{entry.name}</span>
              <span className={styles.score}>{formatScore(entry)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function LeaderboardPanel() {
  const [data, setData] = useState<Leaderboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchLeaderboard(10))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar ranking')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className={styles.embed}>
      <p className={styles.lead}>
        Melhor placar de cada convidado no quiz e no buquê. Jogue e digite seu nome para
        aparecer aqui.
      </p>

      <div className={styles.toolbar}>
        <button type="button" className={styles.refresh} onClick={() => void load()} disabled={loading}>
          {loading ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.boards}>
        <Board
          title="Quiz do casal"
          hint="Acertos"
          entries={data?.quiz ?? []}
          formatScore={(e) => `${e.score}/${e.maxScore || '?'}`}
        />
        <Board
          title="Pegue o buquê"
          hint="Seguidos"
          entries={data?.bouquet ?? []}
          formatScore={(e) => String(e.score)}
        />
      </div>
    </div>
  )
}

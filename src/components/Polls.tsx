import { polls } from '../data/polls'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useReveal } from '../hooks/useReveal'
import styles from './Polls.module.css'

type Votes = Record<string, number>

export function Polls() {
  const ref = useReveal<HTMLElement>()
  const [votes, setVotes] = useLocalStorage<Votes>('lavi-samuel-polls', {})
  const [tallies, setTallies] = useLocalStorage<Record<string, number[]>>(
    'lavi-samuel-poll-tallies',
    {},
  )

  function vote(pollId: string, optionIndex: number, optionCount: number) {
    if (votes[pollId] != null) return
    const current = tallies[pollId] ?? Array.from({ length: optionCount }, () => 0)
    const next = current.map((n, i) => (i === optionIndex ? n + 1 : n))
    setVotes({ ...votes, [pollId]: optionIndex })
    setTallies({ ...tallies, [pollId]: next })
  }

  return (
    <section id="votacoes" className={`section ${styles.section} reveal`} ref={ref}>
      <div className="section__inner">
        <p className="section__eyebrow">Brincadeira 02</p>
        <h2 className="section__title">Votações do cortejo</h2>
        <p className="section__lead">
          Opine com leveza. Um voto por enquete — resultado só neste aparelho.
        </p>

        <div className={styles.list}>
          {polls.map((poll) => {
            const chosen = votes[poll.id]
            const counts = tallies[poll.id] ?? poll.options.map(() => 0)
            const total = counts.reduce((a, b) => a + b, 0) || 1

            return (
              <article key={poll.id} className={styles.poll}>
                <h3 className={styles.question}>{poll.question}</h3>
                <div className={styles.options}>
                  {poll.options.map((option, i) => {
                    const pct = Math.round((counts[i] / total) * 100)
                    const isChosen = chosen === i
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`${styles.option} ${isChosen ? styles.chosen : ''}`}
                        onClick={() => vote(poll.id, i, poll.options.length)}
                        disabled={chosen != null}
                      >
                        <span className={styles.optionLabel}>{option}</span>
                        {chosen != null && (
                          <span className={styles.barWrap} aria-hidden="true">
                            <span className={styles.bar} style={{ width: `${pct}%` }} />
                          </span>
                        )}
                        {chosen != null && <span className={styles.pct}>{pct}%</span>}
                      </button>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
        <p className="hint">Salvo só neste navegador.</p>
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { galleryItems } from '../data/gallery'
import { useReveal } from '../hooks/useReveal'
import styles from './Gallery.module.css'

export function Gallery() {
  const ref = useReveal<HTMLElement>()
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = galleryItems.find((item) => item.id === activeId) ?? null

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveId(null)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [active])

  return (
    <section id="galeria" className={`section ${styles.section} reveal`} ref={ref}>
      <div className="section__inner">
        <p className="section__eyebrow">Brincadeira 04</p>
        <h2 className="section__title">Galeria com legendas</h2>
        <p className="section__lead">
          Clique para ampliar. As legendas são 70% romance, 30% zoação autorizada.
        </p>

        <div className={styles.grid}>
          {galleryItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.item}
              onClick={() => setActiveId(item.id)}
            >
              <img src={item.thumb} alt={item.alt} loading="lazy" />
              <span className={styles.caption}>{item.caption}</span>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
          onClick={() => setActiveId(null)}
        >
          <figure className={styles.figure} onClick={(e) => e.stopPropagation()}>
            <img src={active.src} alt={active.alt} />
            <figcaption>{active.caption}</figcaption>
            <button
              type="button"
              className={styles.close}
              onClick={() => setActiveId(null)}
            >
              Fechar
            </button>
          </figure>
        </div>
      )}
    </section>
  )
}

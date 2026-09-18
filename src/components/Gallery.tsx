import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { galleryItems } from '../data/gallery'
import { useReveal } from '../hooks/useReveal'
import styles from './Gallery.module.css'

export function Gallery() {
  const ref = useReveal<HTMLElement>()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const active = activeIndex != null ? galleryItems[activeIndex] : null
  const touchStartX = useRef<number | null>(null)

  function goPrev() {
    setActiveIndex((i) => {
      if (i == null) return i
      return (i - 1 + galleryItems.length) % galleryItems.length
    })
  }

  function goNext() {
    setActiveIndex((i) => {
      if (i == null) return i
      return (i + 1) % galleryItems.length
    })
  }

  useEffect(() => {
    if (activeIndex == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveIndex(null)
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [activeIndex])

  function onTouchStart(e: TouchEvent) {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null
  }

  function onTouchEnd(e: TouchEvent) {
    const start = touchStartX.current
    const end = e.changedTouches[0]?.clientX
    touchStartX.current = null
    if (start == null || end == null) return
    const delta = end - start
    if (Math.abs(delta) < 50) return
    if (delta > 0) goPrev()
    else goNext()
  }

  return (
    <section id="galeria" className={`section ${styles.section} reveal`} ref={ref}>
      <div className="section__inner">
        <p className="section__eyebrow">Ensaio</p>
        <h2 className="section__title">Galeria com legendas</h2>
        <p className="section__lead">
          Toque para ampliar. Deslize ou use as setas para passar as fotos.
        </p>

        <div className={styles.grid}>
          {galleryItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={styles.item}
              onClick={() => setActiveIndex(index)}
            >
              <img src={item.thumb} alt={item.alt} loading="lazy" />
              <span className={styles.caption}>{item.caption}</span>
            </button>
          ))}
        </div>
      </div>

      {active && activeIndex != null && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
          onClick={() => setActiveIndex(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <figure
            className={styles.figure}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={active.src} alt={active.alt} />
            <figcaption>{active.caption}</figcaption>
            <p className={styles.counter}>
              {activeIndex + 1} / {galleryItems.length}
            </p>
          </figure>

          <div className={styles.lightboxBar} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.nav}
              onClick={goPrev}
              aria-label="Foto anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className={styles.close}
              onClick={() => setActiveIndex(null)}
            >
              Fechar
            </button>
            <button
              type="button"
              className={styles.nav}
              onClick={goNext}
              aria-label="Próxima foto"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

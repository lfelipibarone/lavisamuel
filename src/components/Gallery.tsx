import { useEffect, useRef, useState, type TouchEvent } from 'react'
import type { GalleryItem } from '../data/gallery'
import { useReveal } from '../hooks/useReveal'
import { GUEST_PHOTOS_EVENT, listGuestPhotos } from '../lib/api'
import styles from './Gallery.module.css'

export function Gallery() {
  const ref = useReveal<HTMLElement>()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  const active = activeIndex != null ? items[activeIndex] : null

  async function loadGuestPhotos() {
    setLoading(true)
    try {
      const photos = await listGuestPhotos()
      setItems(
        photos.map((photo) => ({
          id: `guest-${photo.id}`,
          src: photo.url,
          thumb: photo.thumbUrl,
          caption: photo.uploadedBy
            ? `Enviada por ${photo.uploadedBy}`
            : 'Foto dos convidados',
          alt: photo.uploadedBy
            ? `Foto enviada por ${photo.uploadedBy}`
            : 'Foto enviada por convidado',
        })),
      )
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadGuestPhotos()
    const onChange = () => void loadGuestPhotos()
    window.addEventListener(GUEST_PHOTOS_EVENT, onChange)
    return () => window.removeEventListener(GUEST_PHOTOS_EVENT, onChange)
  }, [])

  function goPrev() {
    setActiveIndex((i) => {
      if (i == null || items.length === 0) return i
      return (i - 1 + items.length) % items.length
    })
  }

  function goNext() {
    setActiveIndex((i) => {
      if (i == null || items.length === 0) return i
      return (i + 1) % items.length
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
  }, [activeIndex, items.length])

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
        <p className="section__eyebrow">Convidados</p>
        <h2 className="section__title">Galeria do casamento</h2>
        <p className="section__lead">
          As fotos enviadas pelo álbum aparecem aqui. Toque para ampliar.
        </p>

        {loading && items.length === 0 ? (
          <p className={styles.empty}>Carregando fotos…</p>
        ) : items.length === 0 ? (
          <p className={styles.empty}>
            Ainda não há fotos. Abra o álbum dos convidados e envie a primeira!
          </p>
        ) : (
          <div className={styles.grid}>
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={styles.item}
                onClick={() => setActiveIndex(index)}
              >
                <img
                  src={item.thumb}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                />
                <span className={styles.caption}>{item.caption}</span>
              </button>
            ))}
          </div>
        )}
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
          <figure className={styles.figure} onClick={(e) => e.stopPropagation()}>
            <img src={active.src} alt={active.alt} />
            <figcaption>{active.caption}</figcaption>
            <p className={styles.counter}>
              {activeIndex + 1} / {items.length}
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

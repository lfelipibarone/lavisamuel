import confetti from 'canvas-confetti'

export function fireConfetti() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) return

  const colors = ['#e8e6e1', '#b8b4ab', '#6e6a62', '#1c1b19', '#ffffff']

  void confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.65 },
    colors,
  })

  window.setTimeout(() => {
    void confetti({
      particleCount: 55,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    })
    void confetti({
      particleCount: 55,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    })
  }, 220)
}

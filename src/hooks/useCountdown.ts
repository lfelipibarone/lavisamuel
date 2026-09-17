import { useEffect, useState } from 'react'

export type CountdownPhase = 'countdown' | 'weddingDay' | 'after'

export type CountdownParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  phase: CountdownPhase
  /** True from the wedding moment onward (includes wedding day and after). */
  isDone: boolean
}

/** Wedding instant in America/Sao_Paulo (UTC-3, no DST in 2026). */
export const WEDDING_ISO = '2026-09-24T10:00:00-03:00'
export const WEDDING_MS = Date.parse(WEDDING_ISO)

/** Start of Sept 25, 2026 in America/Sao_Paulo — after the wedding day. */
export const AFTER_WEDDING_DAY_MS = Date.parse('2026-09-25T00:00:00-03:00')

function getPhase(now: number): CountdownPhase {
  if (now < WEDDING_MS) return 'countdown'
  if (now < AFTER_WEDDING_DAY_MS) return 'weddingDay'
  return 'after'
}

function getParts(now = Date.now()): CountdownParts {
  const phase = getPhase(now)
  const totalMs = Math.max(0, WEDDING_MS - now)
  const totalSeconds = Math.floor(totalMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
    phase,
    isDone: phase !== 'countdown',
  }
}

export function useCountdown() {
  const [parts, setParts] = useState<CountdownParts>(() => getParts())

  useEffect(() => {
    const tick = () => setParts(getParts())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return parts
}

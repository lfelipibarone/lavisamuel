import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { guestsRoute } from './routes/guests.js'
import { leaderboardRoute } from './routes/leaderboard.js'
import { oauthRoute } from './routes/oauth.js'
import { photosRoute } from './routes/photos.js'
import { resultsRoute } from './routes/results.js'

function parseCorsOrigins(raw: string | undefined): string[] {
  const defaults = ['http://localhost:5173', 'http://127.0.0.1:5173']
  if (!raw?.trim()) return defaults
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function isDevFriendlyOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true
    if (url.hostname.endsWith('.sslip.io') || url.hostname.endsWith('.local')) return true
    return false
  } catch {
    return false
  }
}

export function createApp() {
  const app = new Hono()
  const configured = parseCorsOrigins(process.env.CORS_ORIGIN)

  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (!origin) return configured[0] ?? '*'
        if (configured.includes(origin) || isDevFriendlyOrigin(origin)) return origin
        return configured[0] ?? origin
      },
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
    }),
  )

  app.get('/health', (c) =>
    c.json({
      ok: true,
      service: 'laviesamuel-api',
      port: process.env.PORT ?? '3002',
      time: new Date().toISOString(),
    }),
  )
  app.route('/oauth', oauthRoute)
  app.route('/guests', guestsRoute)
  app.route('/results', resultsRoute)
  app.route('/leaderboard', leaderboardRoute)
  app.route('/photos', photosRoute)

  app.notFound((c) => c.json({ error: 'Not found' }, 404))
  app.onError((err, c) => {
    console.error(err)
    return c.json({ error: 'Internal server error' }, 500)
  })

  return app
}

import 'dotenv/config'
import { serve } from '@hono/node-server'
import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 3002)
const app = createApp()

// 0.0.0.0 is required in Docker so Traefik/Dokploy can reach the process
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`API listening on http://0.0.0.0:${info.port}`)
})

import 'dotenv/config'
import { serve } from '@hono/node-server'
import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 3002)
const hostname = '0.0.0.0'
const app = createApp()

console.log(`Booting API bind=${hostname} port=${port}`)

serve({ fetch: app.fetch, port, hostname }, (info) => {
  console.log(`API listening on http://${info.address}:${info.port}`)
})

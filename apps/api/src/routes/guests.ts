import { Hono } from 'hono'
import { normalizeNameKey } from '../lib/normalize.js'
import { prisma } from '../lib/prisma.js'
import { createGuestSchema } from '../lib/validate.js'

export const guestsRoute = new Hono()

guestsRoute.post('/', async (c) => {
  const parsed = createGuestSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'Invalid name', details: parsed.error.flatten() }, 400)
  }

  const name = parsed.data.name
  const nameKey = normalizeNameKey(name)

  const guest = await prisma.guest.upsert({
    where: { nameKey },
    create: { name, nameKey },
    update: {},
  })

  return c.json({ id: guest.id, name: guest.name }, 201)
})

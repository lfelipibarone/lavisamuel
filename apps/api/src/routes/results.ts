import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { createResultSchema } from '../lib/validate.js'

export const resultsRoute = new Hono()

resultsRoute.post('/', async (c) => {
  const parsed = createResultSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'Invalid result', details: parsed.error.flatten() }, 400)
  }

  const { guestId, game, score, maxScore } = parsed.data

  const guest = await prisma.guest.findUnique({ where: { id: guestId } })
  if (!guest) {
    return c.json({ error: 'Guest not found' }, 404)
  }

  const result = await prisma.gameResult.create({
    data: { guestId, game, score, maxScore },
  })

  return c.json(
    {
      id: result.id,
      guestId: result.guestId,
      game: result.game,
      score: result.score,
      maxScore: result.maxScore,
      createdAt: result.createdAt,
    },
    201,
  )
})

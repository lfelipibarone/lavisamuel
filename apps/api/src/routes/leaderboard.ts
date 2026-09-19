import { Hono } from 'hono'
import type { Game } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { leaderboardQuerySchema } from '../lib/validate.js'

type RankEntry = {
  rank: number
  name: string
  score: number
  maxScore: number
}

export const leaderboardRoute = new Hono()

leaderboardRoute.get('/', async (c) => {
  const parsed = leaderboardQuerySchema.safeParse({
    limit: c.req.query('limit') ?? undefined,
  })
  if (!parsed.success) {
    return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400)
  }

  const { limit } = parsed.data
  const [quiz, bouquet] = await Promise.all([
    bestScoresForGame('QUIZ', limit),
    bestScoresForGame('BOUQUET', limit),
  ])

  return c.json({ quiz, bouquet })
})

async function bestScoresForGame(game: Game, limit: number): Promise<RankEntry[]> {
  const rows = await prisma.gameResult.groupBy({
    by: ['guestId'],
    where: { game },
    _max: { score: true },
    orderBy: { _max: { score: 'desc' } },
    take: limit,
  })

  if (rows.length === 0) return []

  const guestIds = rows.map((row) => row.guestId)
  const guests = await prisma.guest.findMany({
    where: { id: { in: guestIds } },
    select: { id: true, name: true },
  })
  const nameById = new Map(guests.map((guest) => [guest.id, guest.name]))

  const bestPlays = await prisma.gameResult.findMany({
    where: {
      game,
      OR: rows.map((row) => ({
        guestId: row.guestId,
        score: row._max.score ?? 0,
      })),
    },
    orderBy: { createdAt: 'desc' },
    select: { guestId: true, score: true, maxScore: true },
  })

  const maxScoreByGuest = new Map<string, number>()
  for (const play of bestPlays) {
    if (!maxScoreByGuest.has(play.guestId)) {
      maxScoreByGuest.set(play.guestId, play.maxScore)
    }
  }

  return rows.map((row, index) => ({
    rank: index + 1,
    name: nameById.get(row.guestId) ?? 'Convidado',
    score: row._max.score ?? 0,
    maxScore: maxScoreByGuest.get(row.guestId) ?? 0,
  }))
}

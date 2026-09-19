import { z } from 'zod'

export const createGuestSchema = z.object({
  name: z
    .string()
    .transform((value) => value.replace(/[\u0000-\u001F\u007F]/g, '').trim().replace(/\s+/g, ' '))
    .pipe(z.string().min(2).max(40)),
})

export const createResultSchema = z.object({
  guestId: z.string().min(1),
  game: z.enum(['QUIZ', 'BOUQUET']),
  score: z.number().int().min(0).max(100),
  maxScore: z.number().int().min(1).max(100),
}).refine((data) => data.score <= data.maxScore, {
  message: 'score must be <= maxScore',
  path: ['score'],
})

export const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

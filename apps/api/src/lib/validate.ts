import { z } from 'zod'

export const createGuestSchema = z.object({
  name: z
    .string()
    .transform((value) => value.replace(/[\u0000-\u001F\u007F]/g, '').trim().replace(/\s+/g, ' '))
    .pipe(z.string().min(2).max(40)),
})

export const createResultSchema = z
  .object({
    guestId: z.string().min(1),
    game: z.enum(['QUIZ', 'BOUQUET']),
    score: z.number().int().min(0),
    maxScore: z.number().int().min(1),
  })
  .superRefine((data, ctx) => {
    if (data.score > data.maxScore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'score must be <= maxScore',
        path: ['score'],
      })
    }

    if (data.game === 'QUIZ') {
      if (data.maxScore > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Quiz maxScore must be <= 100',
          path: ['maxScore'],
        })
      }
      return
    }

    // Bouquet: unlimited streak — score is how many were caught before the first miss
    if (data.score > 10_000 || data.maxScore > 10_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bouquet score must be <= 10000',
        path: ['score'],
      })
    }
  })

export const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

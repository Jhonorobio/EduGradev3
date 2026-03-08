import { z } from 'zod'

const colegioSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  status: z.union([
    z.literal('active'),
    z.literal('inactive'),
  ]),
  created_at: z.string(),
})

export type Colegio = z.infer<typeof colegioSchema>
export const colegioListSchema = z.array(colegioSchema)

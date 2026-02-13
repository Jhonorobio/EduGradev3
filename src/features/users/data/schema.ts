import { z } from 'zod'

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  email: z.string(),
  role: z.union([
    z.literal('SUPER_ADMIN'),
    z.literal('ADMIN_COLEGIO'),
    z.literal('DOCENTE'),
  ]),
})

export type User = z.infer<typeof userSchema>
export const userListSchema = z.array(userSchema)

import { z } from 'zod'

const alumnoSchema = z.object({
  id: z.string(),
  name: z.string(),
  last_name: z.string(),
  colegio_id: z.string(),
  colegio_name: z.string(),
  grade_id: z.string(),
  grade_name: z.string(),
  status: z.union([
    z.literal('active'),
    z.literal('inactive'),
    z.literal('suspended'),
  ]),
  created_at: z.string(),
})

export type Alumno = z.infer<typeof alumnoSchema>
export const alumnoListSchema = z.array(alumnoSchema)

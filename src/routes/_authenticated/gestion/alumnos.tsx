import { createFileRoute } from '@tanstack/react-router'
import { AlumnosPage } from '@/features/alumnos'

export const Route = createFileRoute('/_authenticated/gestion/alumnos')({
  component: AlumnosPage,
})

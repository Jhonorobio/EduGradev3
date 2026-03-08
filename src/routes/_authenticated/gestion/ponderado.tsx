import { createFileRoute } from '@tanstack/react-router'
import { PonderadoPage } from '@/features/gestion'

export const Route = createFileRoute('/_authenticated/gestion/ponderado')({
  component: PonderadoPage,
})

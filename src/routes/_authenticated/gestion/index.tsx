import { createFileRoute } from '@tanstack/react-router'
import { GestionPage } from '@/features/gestion'

export const Route = createFileRoute('/_authenticated/gestion/')({
  component: GestionPage,
})

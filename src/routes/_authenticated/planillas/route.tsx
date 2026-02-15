import { createFileRoute } from '@tanstack/react-router'
import { Planillas } from '@/features/planillas/planillas'

export const Route = createFileRoute('/_authenticated/planillas')({
  component: Planillas,
})

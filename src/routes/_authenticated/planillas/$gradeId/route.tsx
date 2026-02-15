import { createFileRoute } from '@tanstack/react-router'
import { PlanillaGrade } from '@/features/planillas/planilla-grade'

export const Route = createFileRoute('/_authenticated/planillas/$gradeId')({
  component: PlanillaGrade,
})

import { createFileRoute } from '@tanstack/react-router'
import { QualitativeReportPage } from '@/features/qualitative-reports/qualitative-report-page'

export const Route = createFileRoute('/_authenticated/informe-cualitativo')({
  component: QualitativeReportPage,
})

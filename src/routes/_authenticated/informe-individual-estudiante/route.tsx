import { createFileRoute } from '@tanstack/react-router'
import { IndividualStudentReportPage } from '@/features/qualitative-reports/individual-student-report-page'

export const Route = createFileRoute('/_authenticated/informe-individual-estudiante')({
  component: IndividualStudentReportPage,
})

import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Periods } from '@/features/academic-settings/periods'

export const Route = createFileRoute('/_authenticated/academic-settings/periods')({
  component: () => (
    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN_COLEGIO']}>
      <Periods />
    </ProtectedRoute>
  ),
})

import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AcademicSettings } from '@/features/academic-settings'

export const Route = createFileRoute('/_authenticated/academic-settings/')({
  component: () => (
    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN_COLEGIO']}>
      <AcademicSettings />
    </ProtectedRoute>
  ),
})

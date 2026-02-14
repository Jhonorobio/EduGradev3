import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Subjects } from '@/features/academic-settings/subjects'

export const Route = createFileRoute('/_authenticated/academic-settings/subjects')({
  component: () => (
    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN_COLEGIO']}>
      <Subjects />
    </ProtectedRoute>
  ),
})

import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Assignments } from '@/features/academic-settings/assignments'

export const Route = createFileRoute('/_authenticated/academic-settings/assignments')({
  component: () => (
    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN_COLEGIO']}>
      <Assignments />
    </ProtectedRoute>
  ),
})

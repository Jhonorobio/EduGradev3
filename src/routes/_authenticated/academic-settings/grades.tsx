import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Grades } from '@/features/academic-settings/grades'

export const Route = createFileRoute('/_authenticated/academic-settings/grades')({
  component: () => (
    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN_COLEGIO']}>
      <Grades />
    </ProtectedRoute>
  ),
})

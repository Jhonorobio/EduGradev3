import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ColegiosPage } from '@/features/colegios'

export const Route = createFileRoute('/_authenticated/gestion/colegios/')({
  component: () => (
    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN_COLEGIO']}>
      <ColegiosPage />
    </ProtectedRoute>
  ),
})

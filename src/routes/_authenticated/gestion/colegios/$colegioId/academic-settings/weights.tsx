import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ColegioWeights } from '@/features/colegios/academic-settings'

export const Route = createFileRoute('/_authenticated/gestion/colegios/$colegioId/academic-settings/weights')({
  component: () => (
    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN_COLEGIO']}>
      <ColegioWeights />
    </ProtectedRoute>
  ),
})

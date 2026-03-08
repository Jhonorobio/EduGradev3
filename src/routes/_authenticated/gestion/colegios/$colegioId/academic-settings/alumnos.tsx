import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ColegioAlumnos } from '@/features/colegios/academic-settings/alumnos'

export const Route = createFileRoute('/_authenticated/gestion/colegios/$colegioId/academic-settings/alumnos')({
  component: () => (
    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN_COLEGIO']}>
      <ColegioAlumnos />
    </ProtectedRoute>
  ),
})

import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ColegioAlumnos } from '@/features/colegios/academic-settings'

export const Route = createFileRoute('/_authenticated/gestion/colegios/$colegio/alumnosId/academic-settings')({
  component: () => (
    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN_COLEGIO']}>
      <ColegioAlumnos />
    </ProtectedRoute>
  ),
})

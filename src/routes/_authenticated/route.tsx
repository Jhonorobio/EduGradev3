import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  component: () => (
    <ProtectedRoute>
      <AuthenticatedLayout />
    </ProtectedRoute>
  ),
})

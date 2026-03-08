import { useAuthStore } from '@/stores/auth-store'
import { UserRole } from '@/types/auth'

export function usePermissions() {
  const { auth } = useAuthStore()

  const user = auth.user

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN
  const isAdminColegio = user?.role === UserRole.ADMIN_COLEGIO
  const isDocente = user?.role === UserRole.DOCENTE

  const canAccessColegios = isSuperAdmin
  const canAccessGestion = isSuperAdmin
  const canAccessAlumnos = isSuperAdmin || isAdminColegio
  const canAccessPonderado = isSuperAdmin || isAdminColegio

  const canAccessPlanillas = isSuperAdmin || isAdminColegio || isDocente
  const canAccessDashboard = true // Todos pueden acceder al dashboard

  return {
    user,
    isSuperAdmin,
    isAdminColegio,
    isDocente,
    permissions: {
      canAccessColegios,
      canAccessGestion,
      canAccessAlumnos,
      canAccessPonderado,
      canAccessPlanillas,
      canAccessDashboard,
    }
  }
}

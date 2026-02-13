import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const { auth } = useAuthStore();
  
  return {
    user: auth.user,
    isAuthenticated: !!auth.user,
    isSuperAdmin: auth.user?.role === 'SUPER_ADMIN',
    isAdminColegio: auth.user?.role === 'ADMIN_COLEGIO',
    isDocente: auth.user?.role === 'DOCENTE',
  };
}

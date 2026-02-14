import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: 'SUPER_ADMIN' | 'ADMIN_COLEGIO' | 'DOCENTE' | Array<'SUPER_ADMIN' | 'ADMIN_COLEGIO' | 'DOCENTE'>;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isSuperAdmin, isAdminColegio, isDocente } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/sign-in', replace: true });
      return;
    }

    if (requiredRole) {
      const hasRequiredRole = Array.isArray(requiredRole)
        ? requiredRole.some(role => 
            (role === 'SUPER_ADMIN' && isSuperAdmin) ||
            (role === 'ADMIN_COLEGIO' && isAdminColegio) ||
            (role === 'DOCENTE' && isDocente)
          )
        : (requiredRole === 'SUPER_ADMIN' && isSuperAdmin) ||
          (requiredRole === 'ADMIN_COLEGIO' && isAdminColegio) ||
          (requiredRole === 'DOCENTE' && isDocente);

      if (!hasRequiredRole) {
        navigate({ to: '/403', replace: true });
        return;
      }
    }
  }, [isAuthenticated, isSuperAdmin, isAdminColegio, isDocente, requiredRole, navigate]);

  if (!isAuthenticated) {
    return null; // or return a loading spinner
  }

  if (requiredRole) {
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.some(role => 
          (role === 'SUPER_ADMIN' && isSuperAdmin) ||
          (role === 'ADMIN_COLEGIO' && isAdminColegio) ||
          (role === 'DOCENTE' && isDocente)
        )
      : (requiredRole === 'SUPER_ADMIN' && isSuperAdmin) ||
        (requiredRole === 'ADMIN_COLEGIO' && isAdminColegio) ||
        (requiredRole === 'DOCENTE' && isDocente);

    if (!hasRequiredRole) {
      return null; // or return an "access denied" component
    }
  }

  return <>{children}</>;
}

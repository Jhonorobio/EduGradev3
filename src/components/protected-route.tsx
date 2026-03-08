import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import { AccessDenied } from '@/components/access-denied'

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermission: keyof ReturnType<typeof usePermissions>['permissions']
  resource?: string
  requiredRole?: string
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  resource, 
  requiredRole 
}: ProtectedRouteProps) {
  const { permissions } = usePermissions()

  if (!permissions[requiredPermission]) {
    return (
      <AccessDenied 
        resource={resource} 
        requiredRole={requiredRole}
      />
    )
  }

  return <>{children}</>
}

import { AlertTriangle, ShieldX } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

interface AccessDeniedProps {
  resource?: string
  requiredRole?: string
}

export function AccessDenied({ resource = 'esta página', requiredRole = 'SUPER_ADMIN' }: AccessDeniedProps) {
  return (
    <div className='container mx-auto p-6'>
      <div className='max-w-2xl mx-auto'>
        <Card className='border-red-200 bg-red-50'>
          <CardHeader className='text-center'>
            <div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4'>
              <ShieldX className='h-8 w-8 text-red-600' />
            </div>
            <CardTitle className='text-2xl font-bold text-red-900'>
              Acceso Denegado
            </CardTitle>
          </CardHeader>
          <CardContent className='text-center space-y-4'>
            <div className='space-y-2'>
              <p className='text-red-800 font-medium'>
                No tienes permisos para acceder a {resource}
              </p>
              <p className='text-red-600 text-sm'>
                Esta sección está restringida para usuarios con rol <strong>{requiredRole}</strong>
              </p>
            </div>
            
            <div className='bg-red-100 border border-red-200 rounded-lg p-4 text-left'>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='h-5 w-5 text-red-600 mt-0.5 flex-shrink-0' />
                <div className='text-sm text-red-700'>
                  <p className='font-medium mb-2'>Si necesitas acceso, contacta al administrador del sistema:</p>
                  <ul className='list-disc list-inside space-y-1'>
                    <li>Verifica que tu cuenta tenga el rol correcto</li>
                    <li>Solicita los permisos necesarios al superadministrador</li>
                    <li>Asegúrate de haber iniciado sesión con la cuenta correcta</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className='flex gap-3 justify-center pt-4'>
              <Button variant='outline' asChild>
                <Link to='/'>
                  Volver al Dashboard
                </Link>
              </Button>
              <Button asChild>
                <Link to='/settings'>
                  Mi Perfil
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

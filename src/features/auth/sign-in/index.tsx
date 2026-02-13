import { useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Iniciar sesión</CardTitle>
          <CardDescription>
            Ingresa tu usuario y contraseña para <br />
            acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
        <CardFooter>
          <p className='px-8 text-center text-sm text-muted-foreground'>
            Al hacer clic en iniciar sesión, aceptas nuestros{' '}
            <a
              href='/terms'
              className='underline underline-offset-4 hover:text-primary'
            >
              Términos de Servicio
            </a>{' '}
            y{' '}
            <a
              href='/privacy'
              className='underline underline-offset-4 hover:text-primary'
            >
              Política de Privacidad
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft, Users, BookOpen } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

interface GradebookPageProps {
  subjectId: string
  gradeId: string
  subjectName: string
  gradeName: string
}

export function GradebookPage({ subjectId, gradeId, subjectName, gradeName }: GradebookPageProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('GradebookPage mounted with:', { subjectId, gradeId, subjectName, gradeName })
    setLoading(false)
  }, [subjectId, gradeId, subjectName, gradeName])

  if (loading) {
    return (
      <ProtectedRoute>
        <Header>
          <Search />
          <div className='ms-auto flex items-center gap-4'>
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main fixed>
          <div className='flex items-center justify-center min-h-96'>
            <div className='text-center'>
              <BookOpen className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <p className='text-muted-foreground'>Cargando planilla...</p>
            </div>
          </div>
        </Main>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Header>
        <Search />
        <div className='ms-auto flex items-center gap-4'>
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate({ to: '/planillas' })}
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Volver a Planillas
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                Planilla de Calificaciones
              </h1>
              <p className='text-muted-foreground'>
                {subjectName} - {gradeName}
              </p>
            </div>
          </div>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BookOpen className='h-5 w-5' />
                Información de la Planilla
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-3'>
                <div className='text-center p-4 border rounded-lg'>
                  <Users className='h-8 w-8 mx-auto mb-2 text-blue-600' />
                  <div className='text-2xl font-bold'>--</div>
                  <div className='text-sm text-muted-foreground'>Estudiantes</div>
                </div>
                <div className='text-center p-4 border rounded-lg'>
                  <BookOpen className='h-8 w-8 mx-auto mb-2 text-green-600' />
                  <div className='text-2xl font-bold'>--</div>
                  <div className='text-sm text-muted-foreground'>Actividades</div>
                </div>
                <div className='text-center p-4 border rounded-lg'>
                  <div className='text-2xl font-bold'>--</div>
                  <div className='text-sm text-muted-foreground'>Promedio General</div>
                </div>
              </div>
              
              <div className='mt-6 p-4 bg-muted rounded-lg'>
                <h3 className='font-semibold mb-2'>Estado del Sistema</h3>
                <p className='text-sm text-muted-foreground'>
                  La planilla está cargando datos desde la base de datos. 
                  Subject ID: {subjectId}<br/>
                  Grade ID: {gradeId}<br/>
                  Usuario: {user?.name}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximamente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Esta es una versión simplificada de la planilla. 
                La funcionalidad completa de gestión de calificaciones estará disponible próximamente.
              </p>
            </CardContent>
          </Card>
        </div>
      </Main>
    </ProtectedRoute>
  )
}

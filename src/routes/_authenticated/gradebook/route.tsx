import { createFileRoute } from '@tanstack/react-router'
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
import { ArrowLeft, Users, BookOpen, Plus, Calculator } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/gradebook')({
  component: GradebookPage,
  validateSearch: (search: Record<string, unknown>) => ({
    subjectId: search.subjectId as string || '',
    gradeId: search.gradeId as string || '',
    subjectName: search.subjectName as string || 'Materia',
    gradeName: search.gradeName as string || 'Grado'
  })
})

function GradebookPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const searchParams = Route.useSearch()
  
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<{id: number, name: string, number: number}[]>([])
  const [activities, setActivities] = useState<{id: number, name: string, category: string, maxScore: number}[]>([])

  useEffect(() => {
    console.log('GradebookPage mounted with searchParams:', searchParams)
    
    // Simular carga de datos
    setTimeout(() => {
      setStudents([
        { id: 1, name: 'Juan Pérez', number: 1 },
        { id: 2, name: 'María González', number: 2 },
        { id: 3, name: 'Carlos Rodríguez', number: 3 },
        { id: 4, name: 'Ana Martínez', number: 4 },
        { id: 5, name: 'Luis Sánchez', number: 5 }
      ])
      
      setActivities([
        { id: 1, name: 'Tarea 1', category: 'Apuntes y Tareas', maxScore: 100 },
        { id: 2, name: 'Taller Lectura', category: 'Talleres y Exposiciones', maxScore: 100 },
        { id: 3, name: 'Participación', category: 'Actitudinal', maxScore: 50 },
        { id: 4, name: 'Examen Parcial', category: 'Evaluación', maxScore: 100 }
      ])
      
      setLoading(false)
    }, 1000)
  }, [searchParams])

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
              <p className='text-muted-foreground'>Cargando planilla de calificaciones...</p>
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
                {searchParams.subjectName} - {searchParams.gradeName}
              </p>
            </div>
          </div>
          
          <Button>
            <Plus className='h-4 w-4 mr-2' />
            Agregar Actividad
          </Button>
        </div>

        {/* Summary Cards */}
        <div className='grid gap-4 md:grid-cols-4 mb-6'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <Users className='h-5 w-5 text-blue-600' />
                <div>
                  <div className='text-2xl font-bold'>{students.length}</div>
                  <div className='text-sm text-muted-foreground'>Estudiantes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <BookOpen className='h-5 w-5 text-green-600' />
                <div>
                  <div className='text-2xl font-bold'>{activities.length}</div>
                  <div className='text-sm text-muted-foreground'>Actividades</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <Calculator className='h-5 w-5 text-purple-600' />
                <div>
                  <div className='text-2xl font-bold'>85.5%</div>
                  <div className='text-sm text-muted-foreground'>Promedio General</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <BookOpen className='h-5 w-5 text-orange-600' />
                <div>
                  <div className='text-2xl font-bold'>12</div>
                  <div className='text-sm text-muted-foreground'>Calificaciones Guardadas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gradebook Table */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BookOpen className='h-5 w-5' />
              Planilla de Calificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse border border-gray-300'>
                <thead>
                  <tr className='bg-gray-50'>
                    <th className='border border-gray-300 px-4 py-2 text-left'>#</th>
                    <th className='border border-gray-300 px-4 py-2 text-left'>Estudiante</th>
                    {activities.map(activity => (
                      <th key={activity.id} className='border border-gray-300 px-4 py-2 text-center'>
                        <div>
                          <div className='font-medium'>{activity.name}</div>
                          <div className='text-xs text-gray-500'>{activity.category}</div>
                          <div className='text-xs text-gray-500'>Max: {activity.maxScore}</div>
                        </div>
                      </th>
                    ))}
                    <th className='border border-gray-300 px-4 py-2 text-center'>
                      <Calculator className='h-4 w-4 mx-auto' />
                      <div className='text-xs'>Promedio</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id} className='hover:bg-gray-50'>
                      <td className='border border-gray-300 px-4 py-2'>{index + 1}</td>
                      <td className='border border-gray-300 px-4 py-2 font-medium'>
                        {student.name}
                      </td>
                      {activities.map(activity => (
                        <td key={activity.id} className='border border-gray-300 px-4 py-2 text-center'>
                          <input
                            type='number'
                            className='w-16 text-center border rounded px-1 py-1'
                            placeholder='0'
                            min='0'
                            max={activity.maxScore}
                            step='0.1'
                          />
                        </td>
                      ))}
                      <td className='border border-gray-300 px-4 py-2 text-center font-medium'>
                        --
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Información de Depuración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-sm space-y-1'>
              <p><strong>Subject ID:</strong> {searchParams.subjectId}</p>
              <p><strong>Grade ID:</strong> {searchParams.gradeId}</p>
              <p><strong>Subject Name:</strong> {searchParams.subjectName}</p>
              <p><strong>Grade Name:</strong> {searchParams.gradeName}</p>
              <p><strong>User:</strong> {user?.name}</p>
              <p><strong>URL Actual:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </Main>
    </ProtectedRoute>
  )
}

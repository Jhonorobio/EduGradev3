import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Plus, Edit, Trash2, User, BookOpen, Calendar, GraduationCap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { AssignmentsSkeleton } from './components/academic-skeletons'

const route = getRouteApi('/_authenticated/academic-settings/assignments/')

// Datos de ejemplo
const assignmentsData = [
  {
    id: '1',
    teacher: 'María González',
    subject: 'Matemáticas',
    grade: 'Primero de Primaria',
    section: 'A',
    period: 'Primer Periodo',
    status: 'active',
    schedule: 'Lunes, Miércoles, Viernes 8:00-9:30'
  },
  {
    id: '2',
    teacher: 'Juan Pérez',
    subject: 'Español',
    grade: 'Segundo de Primaria',
    section: 'A',
    period: 'Primer Periodo',
    status: 'active',
    schedule: 'Martes, Jueves 10:00-11:30'
  },
  {
    id: '3',
    teacher: 'Ana Rodríguez',
    subject: 'Ciencias',
    grade: 'Tercero de Primaria',
    section: 'A',
    period: 'Segundo Periodo',
    status: 'pending',
    schedule: 'Lunes, Miércoles 14:00-15:30'
  },
  {
    id: '4',
    teacher: 'Carlos Martínez',
    subject: 'Historia',
    grade: 'Primero de Secundaria',
    section: 'A',
    period: 'Primer Periodo',
    status: 'active',
    schedule: 'Martes, Jueves, Viernes 9:00-10:30'
  }
]

export function Assignments() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <>
        <Header fixed>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <AssignmentsSkeleton />
        </Main>
      </>
    )
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Asignaciones</h2>
            <p className='text-muted-foreground'>
              Gestiona las asignaciones de materias a docentes.
            </p>
          </div>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Nueva Asignación
          </Button>
        </div>

        <div className='grid gap-4 md:grid-cols-1 lg:grid-cols-2'>
          {assignmentsData.map((assignment) => (
            <Card key={assignment.id} className='hover:shadow-md transition-shadow'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <ClipboardList className='h-5 w-5' />
                    Asignación #{assignment.id}
                  </CardTitle>
                  <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                    {assignment.status === 'active' ? 'Activa' : 'Pendiente'}
                  </Badge>
                </div>
                <CardDescription>
                  {assignment.period}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2 text-sm'>
                    <User className='h-4 w-4 text-muted-foreground' />
                    <span className='text-muted-foreground'>Profesor:</span>
                    <span className='font-medium'>{assignment.teacher}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm'>
                    <BookOpen className='h-4 w-4 text-muted-foreground' />
                    <span className='text-muted-foreground'>Materia:</span>
                    <span className='font-medium'>{assignment.subject}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm'>
                    <GraduationCap className='h-4 w-4 text-muted-foreground' />
                    <span className='text-muted-foreground'>Grado:</span>
                    <span className='font-medium'>{assignment.grade} - Sección {assignment.section}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm'>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                    <span className='text-muted-foreground'>Horario:</span>
                    <span className='font-medium'>{assignment.schedule}</span>
                  </div>
                  <div className='flex gap-2 pt-2'>
                    <Button variant='outline' size='sm'>
                      <Edit className='mr-2 h-4 w-4' />
                      Editar
                    </Button>
                    <Button variant='outline' size='sm'>
                      <Trash2 className='mr-2 h-4 w-4' />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Main>
    </>
  )
}

import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, GraduationCap, ClipboardList, ArrowLeft, Calculator } from 'lucide-react'
import { Link } from '@tanstack/react-router'

const route = getRouteApi('/_authenticated/gestion/colegios/$colegioId/academic-settings/')

export function ColegioAcademicSettings() {
  const { colegioId } = route.useParams()

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
        <div className='flex items-center gap-4'>
          <Link to='/gestion/colegios'>
            <Button variant='outline' size='sm'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Volver a Colegios
            </Button>
          </Link>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Ajustes Académicos</h2>
            <p className='text-muted-foreground'>
              Gestiona la configuración académica del colegio.
            </p>
          </div>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <Link to={`/gestion/colegios/${colegioId}/academic-settings/subjects`}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Materias</CardTitle>
                <BookOpen className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>Gestionar</div>
                <p className='text-xs text-muted-foreground'>
                  Administra las materias del colegio
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <Link to={`/gestion/colegios/${colegioId}/academic-settings/grades`}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Grados</CardTitle>
                <GraduationCap className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>Gestionar</div>
                <p className='text-xs text-muted-foreground'>
                  Administra los grados del colegio
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <Link to={`/gestion/colegios/${colegioId}/academic-settings/assignments`}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Asignaciones</CardTitle>
                <ClipboardList className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>Gestionar</div>
                <p className='text-xs text-muted-foreground'>
                  Administra las asignaciones del colegio
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <Link to={`/gestion/colegios/${colegioId}/academic-settings/weights`}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Ponderados</CardTitle>
                <Calculator className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>Configurar</div>
                <p className='text-xs text-muted-foreground'>
                  Configura los ponderados de notas y períodos
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </Main>
    </>
  )
}

export { ColegioSubjects } from './subjects'
export { ColegioGrades } from './grades'
export { ColegioAssignments } from './assignments'
export { ColegioWeights } from './weights'
export { ColegioAlumnos } from './alumnos'

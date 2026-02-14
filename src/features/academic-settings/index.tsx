import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, BookOpen, GraduationCap, ClipboardList } from 'lucide-react'
import { Link } from '@tanstack/react-router'

const route = getRouteApi('/_authenticated/academic-settings/')

export function AcademicSettings() {
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
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Ajustes Académicos</h2>
          <p className='text-muted-foreground'>
            Gestiona la configuración académica del sistema.
          </p>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <Link to='/academic-settings/periods'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Periodos</CardTitle>
                <Calendar className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>Gestionar</div>
                <p className='text-xs text-muted-foreground'>
                  Configura los periodos académicos
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <Link to='/academic-settings/subjects'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Materias</CardTitle>
                <BookOpen className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>Gestionar</div>
                <p className='text-xs text-muted-foreground'>
                  Administra las materias del sistema
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <Link to='/academic-settings/grades'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Grados</CardTitle>
                <GraduationCap className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>Gestionar</div>
                <p className='text-xs text-muted-foreground'>
                  Configura los grados y niveles
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <Link to='/academic-settings/assignments'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Asignaciones</CardTitle>
                <ClipboardList className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>Gestionar</div>
                <p className='text-xs text-muted-foreground'>
                  Asigna materias a docentes
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </Main>
    </>
  )
}

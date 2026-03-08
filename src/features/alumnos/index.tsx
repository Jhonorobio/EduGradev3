import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { AlumnosDialogs } from './components/alumnos-dialogs'
import { AlumnosPrimaryButtons } from './components/alumnos-primary-buttons'
import { AlumnosProvider } from './components/alumnos-provider'
import { AlumnosTable } from './components/alumnos-table'
import { getAlumnos } from '@/services/alumnos'
import { getGrades } from '@/services/grades'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'

export function AlumnosPage() {
  const { isSuperAdmin, isAuthenticated } = useAuth()
  const [alumnosData, setAlumnosData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      const loadData = async () => {
        try {
          // Cargar alumnos y grados de la base de datos
          const [alumnos, grades] = await Promise.all([
            getAlumnos(),
            getGrades()
          ])
          
          setAlumnosData(alumnos)
          setLoading(false)
        } catch (error) {
          console.error('Error loading data:', error)
          setLoading(false)
        }
      }

      loadData()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Listen for alumnos data changes
  useEffect(() => {
    const handleAlumnosDataChanged = async () => {
      try {
        // Recargar datos de la base de datos
        const alumnos = await getAlumnos()
        setAlumnosData(alumnos)
      } catch (error) {
        console.error('Error refreshing alumnos data:', error)
      }
    }

    window.addEventListener('alumnos-data-changed', handleAlumnosDataChanged)
    
    return () => {
      window.removeEventListener('alumnos-data-changed', handleAlumnosDataChanged)
    }
  }, [])

  // Filter alumnos based on role
  const filteredAlumnos = isSuperAdmin 
    ? alumnosData // Super admin can see all alumnos
    : alumnosData // For now, all authenticated users can see alumnos

  return (
    <AlumnosProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>Alumnos</h2>
            <p className='text-muted-foreground'>
              Gestiona los alumnos y su información aquí.
            </p>
          </div>
          <AlumnosPrimaryButtons />
        </div>
        <AlumnosTable data={filteredAlumnos} search={{}} navigate={() => {}} loading={loading} />
      </Main>

      <AlumnosDialogs />
    </AlumnosProvider>
  )
}

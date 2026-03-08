import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ColegiosDialogs } from './components/colegios-dialogs'
import { ColegiosPrimaryButtons } from './components/colegios-primary-buttons'
import { ColegiosProvider } from './components/colegios-provider'
import { ColegiosTable } from './components/colegios-table'
import { getColegios } from '@/services/colegios'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'

const route = getRouteApi('/_authenticated/gestion/colegios')

export function ColegiosPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { isSuperAdmin, isAuthenticated } = useAuth()
  const [colegios, setColegios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      getColegios().then(data => {
        setColegios(data)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Listen for colegios data changes
  useEffect(() => {
    const handleColegiosDataChanged = async () => {
      try {
        const data = await getColegios()
        setColegios(data)
      } catch (error) {
        console.error('Error refreshing colegios data:', error)
      }
    }

    window.addEventListener('colegios-data-changed', handleColegiosDataChanged)
    
    return () => {
      window.removeEventListener('colegios-data-changed', handleColegiosDataChanged)
    }
  }, [])

  // Filter colegios based on role (similar to users)
  const filteredColegios = isSuperAdmin 
    ? colegios // Super admin can see all colegios
    : colegios // For now, all authenticated users can see colegios

  return (
    <ColegiosProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Lista de Colegios</h2>
            <p className='text-muted-foreground'>
              Gestiona los colegios y su información aquí.
            </p>
          </div>
          <ColegiosPrimaryButtons />
        </div>
        <ColegiosTable data={filteredColegios} search={search} navigate={navigate} loading={loading} />
      </Main>

      <ColegiosDialogs />
    </ColegiosProvider>
  )
}

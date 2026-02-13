import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { getUsers } from '@/services/users'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { isSuperAdmin, isAuthenticated } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      getUsers().then(data => {
        setUsers(data)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Filter users based on role
  const filteredUsers = isSuperAdmin 
    ? users // Super admin can see all users
    : users.filter(user => user.role !== 'SUPER_ADMIN') // Non-super admins cannot see super admins

  return (
    <UsersProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>Lista de Usuarios</h2>
            <p className='text-muted-foreground'>
              Gestiona los usuarios y sus roles aquí.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <UsersTable data={filteredUsers} search={search} navigate={navigate} loading={loading} />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}

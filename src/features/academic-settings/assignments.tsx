import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Users } from 'lucide-react'
import { useState, useEffect } from "react"
import { TeacherAssignmentsList } from "./components/teacher-assignments-list"
import { AssignmentsSkeleton } from "./components/academic-skeletons"
import { toast } from "sonner"

const route = getRouteApi('/_authenticated/academic-settings/assignments/')

export function Assignments() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
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
        </div>

        <TeacherAssignmentsList onRefresh={handleRefresh} />
      </Main>
    </>
  )
}

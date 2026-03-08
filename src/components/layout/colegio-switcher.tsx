import * as React from 'react'
import { ChevronsUpDown, Building2, GraduationCap, Settings, UserCheck } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { useActiveColegiosList } from '@/hooks/use-active-colegios'
import { useAuth } from '@/hooks/use-auth'

type ColegioSwitcherProps = {
  onColegioChange?: (colegioId: string) => void
}

export function ColegioSwitcher({ onColegioChange }: ColegioSwitcherProps) {
  const { isMobile } = useSidebar()
  const { isSuperAdmin } = useAuth()
  const { colegios, hasActiveColegios, isLoading } = useActiveColegiosList()
  const [activeColegio, setActiveColegio] = React.useState<string>('')

  React.useEffect(() => {
    if (hasActiveColegios && colegios.length > 0 && !activeColegio) {
      const firstColegio = colegios[0]
      setActiveColegio(firstColegio.id)
      onColegioChange?.(firstColegio.id)
    }
  }, [colegios, hasActiveColegios, activeColegio, onColegioChange])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Settings
      case 'teacher':
        return GraduationCap
      case 'staff':
        return UserCheck
      default:
        return UserCheck
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'teacher':
        return 'Docente'
      case 'staff':
        return 'Personal'
      default:
        return role
    }
  }

  const currentColegio = colegios.find(c => c.id === activeColegio)

  // Super Admin no necesita selector de colegios
  if (isSuperAdmin) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'>
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white'>
              <Building2 className='size-4' />
            </div>
            <div className='grid flex-1 text-start text-sm leading-tight'>
              <span className='truncate font-semibold'>Super Admin</span>
              <span className='truncate text-xs'>Acceso Total</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!hasActiveColegios) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'>
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
              <Building2 className='size-4' />
            </div>
            <div className='grid flex-1 text-start text-sm leading-tight'>
              <span className='truncate font-semibold'>Sin Colegios</span>
              <span className='truncate text-xs'>Contacta al admin</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' disabled>
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-muted'>
              <Building2 className='size-4 animate-pulse' />
            </div>
            <div className='grid flex-1 text-start text-sm leading-tight'>
              <span className='truncate font-semibold'>Cargando...</span>
              <span className='truncate text-xs'>Obteniendo colegios</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                <Building2 className='size-4' />
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {currentColegio?.name || 'Selecciona un colegio'}
                </span>
                <span className='truncate text-xs'>
                  {currentColegio ? `${currentColegio.code} • ${getRoleLabel(currentColegio.role)}` : 'Elige un colegio'}
                </span>
              </div>
              <ChevronsUpDown className='ms-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-xs text-muted-foreground'>
              Colegios Activos
            </DropdownMenuLabel>
            {colegios.map((colegio) => {
              const RoleIcon = getRoleIcon(colegio.role)
              return (
                <DropdownMenuItem
                  key={colegio.id}
                  onClick={() => {
                    setActiveColegio(colegio.id)
                    onColegioChange?.(colegio.id)
                  }}
                  className='gap-2 p-2'
                >
                  <div className='flex size-6 items-center justify-center rounded-sm border'>
                    <Building2 className='size-4 shrink-0' />
                  </div>
                  <div className='flex-1'>
                    <div className='font-medium'>{colegio.name}</div>
                    <div className='text-xs text-muted-foreground'>{colegio.code}</div>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <RoleIcon className="h-3 w-3" />
                    {getRoleLabel(colegio.role)}
                  </Badge>
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className='gap-2 p-2 text-muted-foreground'>
              <div className='flex size-6 items-center justify-center rounded-md border bg-background'>
                <Building2 className='size-4' />
              </div>
              <div className='font-medium text-muted-foreground'>
                {colegios.length} colegio{colegios.length !== 1 ? 's' : ''} disponible{colegios.length !== 1 ? 's' : ''}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

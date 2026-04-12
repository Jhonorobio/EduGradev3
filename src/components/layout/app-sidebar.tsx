import { useLayout } from '@/context/layout-provider'
import { useAuth } from '@/hooks/use-auth'
import { useColegio } from '@/hooks/use-colegio'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { ColegioSwitcher } from './colegio-switcher'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { user, isSuperAdmin, isAdminColegio, isDocente } = useAuth()
  const { setSelectedColegio } = useColegio()

  const allowedForDocente = [
    'Dashboard',
    'Planillas',
    'Informe Preliminar',
    'Configuración',
    'Centro de Ayuda',
  ]

  // URLs permitidas para docentes (para verificación adicional)
  const allowedUrlsForDocente = [
    '/',
    '/planillas',
    '/informe-cualitativo',
    '/settings',
    '/settings/account',
    '/settings/appearance',
    '/settings/notifications',
    '/settings/display',
    '/help-center',
  ]

  // Function to format role names
  const formatRole = (role: string): string => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Admin'
      case 'ADMIN_COLEGIO':
        return 'Admin Colegio'
      case 'DOCENTE':
        return 'Docente'
      default:
        return role
    }
  }

  // Filter nav groups based on user role
  const filteredNavGroups = sidebarData.navGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => {
          if (isSuperAdmin || isAdminColegio) {
            if (
              item.title === 'Gestión' ||
              item.title === 'Ajustes Académicos'
            ) {
              return true
            }
            if (item.title === 'Usuarios') {
              return true
            }
            return true
          }

          if (isDocente) {
            return allowedForDocente.includes(item.title)
          }

          // Default: hide admin menus
          if (item.title === 'Gestión' || item.title === 'Ajustes Académicos') {
            return false
          }
          if (item.title === 'Usuarios') {
            return false
          }
          return true
        })
        .map((item) => {
          if (isSuperAdmin || isAdminColegio) {
            return item
          }

          if (isDocente && item.items) {
            if (item.title === 'Configuración') {
              return {
                ...item,
                items: item.items.filter((subItem) => {
                  const allowedSubItems = [
                    'Perfil',
                    'Cuenta',
                    'Apariencia',
                    'Notificaciones',
                    'Pantalla',
                  ]
                  return allowedSubItems.includes(subItem.title)
                }),
              }
            }
            return item
          }

          if (
            item.items &&
            (item.title === 'Gestión' || item.title === 'Ajustes Académicos')
          ) {
            return item
          }
          return item
        }),
    }))
    .filter((group) => group.items.length > 0)

  // Create user data for NavUser component
  const navUserData = user
    ? {
        name: user.name,
        email: formatRole(user.role), // Show formatted role instead of email
        avatar: user.avatar || '/avatars/edugrade.jpg',
      }
    : {
        name: 'Usuario EduGrade',
        email: 'usuario@edugrade.com',
        avatar: '/avatars/edugrade.jpg',
      }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <ColegioSwitcher onColegioChange={setSelectedColegio} />
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUserData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

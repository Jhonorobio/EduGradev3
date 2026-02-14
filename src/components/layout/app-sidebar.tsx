import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { useAuth } from '@/hooks/use-auth'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { user, isSuperAdmin, isAdminColegio } = useAuth()
  
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
  const filteredNavGroups = sidebarData.navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // Only show "Usuarios" item to admin users
      if (item.title === 'Usuarios') {
        return isSuperAdmin || isAdminColegio
      }
      // Only show "Ajustes Académicos" item to admin users
      if (item.title === 'Ajustes Académicos') {
        return isSuperAdmin || isAdminColegio
      }
      return true
    })
  })).filter(group => group.items.length > 0)
  
  // Create user data for NavUser component
  const navUserData = user ? {
    name: user.name,
    email: formatRole(user.role), // Show formatted role instead of email
    avatar: user.avatar || '/avatars/edugrade.jpg'
  } : {
    name: 'Usuario EduGrade',
    email: 'usuario@edugrade.com',
    avatar: '/avatars/edugrade.jpg'
  }
  
  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <AppTitle />
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

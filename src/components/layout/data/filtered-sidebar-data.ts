import { useAuth } from '@/hooks/use-auth'
import { sidebarData } from './sidebar-data'

export function useFilteredSidebarData() {
  const { isAdmin, isDocente } = useAuth()
  
  const allowedForDocente = [
    'Dashboard',
    'Planillas',
    'Informe Preliminar',
    'Informe Individual',
    'Configuración',
    'Centro de Ayuda'
  ]
  
  const filteredData = {
    ...sidebarData,
    navGroups: sidebarData.navGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (isAdmin) {
          return true
        }

        if (isDocente) {
          if (item.items) {
            return allowedForDocente.includes(item.title)
          }
          return allowedForDocente.includes(item.title)
        }

        if (!item.items) {
          return !['Gestión', 'Ajustes Académicos'].includes(item.title)
        }
        
        if (item.title === 'Gestión' || item.title === 'Ajustes Académicos') {
          return false
        }
        
        return true
      }).map(item => {
        if (isAdmin) {
          return item
        }

        if (isDocente && item.items) {
          if (item.title === 'Configuración') {
            return {
              ...item,
              items: item.items.filter(subItem => {
                const allowedSubItems = [
                  'Perfil',
                  'Cuenta',
                  'Apariencia',
                  'Notificaciones',
                  'Pantalla'
                ]
                return allowedSubItems.includes(subItem.title)
              })
            }
          }
          return item
        }
        
        if (item.items && (item.title === 'Gestión' || item.title === 'Ajustes Académicos')) {
          return item
        }
        
        return item
      })
    }))
  }
  
  return filteredData
}

import {
  Construction,
  LayoutDashboard,
  Monitor,
  Bug,
  ListTodo,
  FileX,
  HelpCircle,
  Lock,
  Bell,
  Package,
  Palette,
  ServerOff,
  Settings,
  Wrench,
  UserCog,
  UserX,
  Users,
  MessagesSquare,
  ShieldCheck,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Usuario EduGrade',
    email: 'usuario@edugrade.com',
    avatar: '/avatars/edugrade.jpg',
  },
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Tareas',
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: 'Aplicaciones',
          url: '/apps',
          icon: Package,
        },
        {
          title: 'Chats',
          url: '/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: 'Usuarios',
          url: '/users',
          icon: Users,
        },
      ],
    },
    {
      title: 'Páginas',
      items: [
        {
          title: 'Autenticación',
          icon: ShieldCheck,
          items: [
            {
              title: 'Iniciar Sesión',
              url: '/sign-in',
            },
            {
              title: 'Iniciar Sesión (2 Columnas)',
              url: '/sign-in-2',
            },
            {
              title: 'Registrarse',
              url: '/sign-up',
            },
            {
              title: 'Olvidé Contraseña',
              url: '/forgot-password',
            },
            {
              title: 'OTP',
              url: '/otp',
            },
          ],
        },
        {
          title: 'Errores',
          icon: Bug,
          items: [
            {
              title: 'No Autorizado',
              url: '/errors/unauthorized',
              icon: Lock,
            },
            {
              title: 'Prohibido',
              url: '/errors/forbidden',
              icon: UserX,
            },
            {
              title: 'No Encontrado',
              url: '/errors/not-found',
              icon: FileX,
            },
            {
              title: 'Error del Servidor',
              url: '/errors/internal-server-error',
              icon: ServerOff,
            },
            {
              title: 'Error de Mantenimiento',
              url: '/errors/maintenance-error',
              icon: Construction,
            },
          ],
        },
      ],
    },
    {
      title: 'Otros',
      items: [
        {
          title: 'Configuración',
          icon: Settings,
          items: [
            {
              title: 'Perfil',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Cuenta',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Apariencia',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notificaciones',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Pantalla',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Centro de Ayuda',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}

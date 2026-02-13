import { Shield, UserCheck, Users, GraduationCap } from 'lucide-react'

export const roles = [
  {
    label: 'Super Admin',
    value: 'SUPER_ADMIN',
    icon: Shield,
  },
  {
    label: 'Admin Colegio',
    value: 'ADMIN_COLEGIO',
    icon: UserCheck,
  },
  {
    label: 'Docente',
    value: 'DOCENTE',
    icon: GraduationCap,
  },
] as const

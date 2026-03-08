import { Shield, UserCheck, GraduationCap, CheckCircle, XCircle, Ban } from 'lucide-react'

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

export const statuses = [
  {
    label: 'Active',
    value: 'active',
    icon: CheckCircle,
  },
  {
    label: 'Inactive',
    value: 'inactive',
    icon: XCircle,
  },
  {
    label: 'Suspended',
    value: 'suspended',
    icon: Ban,
  },
] as const

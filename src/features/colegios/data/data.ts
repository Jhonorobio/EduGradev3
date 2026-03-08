import { CheckCircle, XCircle, Building2, Plus, Edit, Trash2 } from 'lucide-react'

export const colegioStatuses = [
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
] as const

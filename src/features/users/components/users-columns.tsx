import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { Building2, UserCheck, GraduationCap, Settings } from 'lucide-react'
import { roles } from '../data/data'
import { type User } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

// Status badge configurations
const statusConfig = {
  active: {
    label: 'Active',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300',
  },
  inactive: {
    label: 'Inactive',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300',
  },
  suspended: {
    label: 'Suspended',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300',
  },
}

export const usersColumns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    meta: {
      className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'username',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Username' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>{row.getValue('username')}</LongText>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>{row.getValue('name')}</LongText>
    ),
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='w-fit ps-2 text-nowrap'>{row.getValue('email')}</div>
    ),
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const { role } = row.original
      const userType = roles.find(({ value }) => value === role)

      if (!userType) {
        return null
      }

      return (
        <div className='flex items-center gap-x-2'>
          {userType.icon && (
            <userType.icon size={16} className='text-muted-foreground' />
          )}
          <span className='text-sm capitalize'>{row.getValue('role')}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as keyof typeof statusConfig
      const config = statusConfig[status]

      if (!config) {
        return <Badge variant='secondary'>Unknown</Badge>
      }

      return (
        <Badge 
          variant={config.variant} 
          className={config.className}
        >
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'colegios',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Colegios' />
    ),
    cell: ({ row }) => {
      const user = row.original as any
      const colegios = user.colegios || []

      if (colegios.length === 0) {
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="text-sm">Sin colegios</span>
          </div>
        )
      }

      if (colegios.length === 1) {
        const colegio = colegios[0]
        const RoleIcon = getRoleIcon(colegio.role)
        
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">{colegio.name}</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <RoleIcon className="h-3 w-3" />
                {getRoleLabel(colegio.role)}
              </Badge>
            </div>
          </div>
        )
      }

      return (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {colegios.length} colegios
            </Badge>
          </div>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const user = row.original as any
      const colegios = user.colegios || []
      const selectedColegioIds = Array.isArray(value) ? value : [value]
      
      if (selectedColegioIds.length === 0) return true
      
      return colegios.some((c: any) => 
        selectedColegioIds.includes(c.id)
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]

function getRoleIcon(role: string) {
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

function getRoleLabel(role: string) {
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

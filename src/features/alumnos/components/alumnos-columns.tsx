import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { Building2, GraduationCap, UserCheck, Settings } from 'lucide-react'
import { statuses } from '../data/data'
import { type Alumno } from '../data/schema'
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

export const alumnosColumns: ColumnDef<Alumno>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nombre' />
    ),
    cell: ({ row }) => {
      const alumno = row.original
      return (
        <div className='font-medium'>
          {alumno.name} {alumno.last_name}
        </div>
      )
    },
  },
  {
    accessorKey: 'colegio_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Colegio' />
    ),
    cell: ({ row }) => {
      const alumno = row.original
      return (
        <Badge variant='outline' className='flex items-center gap-1'>
          <Building2 className='h-3 w-3' />
          {alumno.colegio_name}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const alumno = row.original as any
      const selectedColegioIds = Array.isArray(value) ? value : [value]
      
      if (selectedColegioIds.length === 0) return true
      
      return selectedColegioIds.includes(alumno.colegio_id)
    },
  },
  {
    accessorKey: 'grade_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Grado' />
    ),
    cell: ({ row }) => {
      const alumno = row.original
      return (
        <Badge variant='secondary' className='flex items-center gap-1'>
          <GraduationCap className='h-3 w-3' />
          {alumno.grade_name}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const alumno = row.original as any
      const selectedGradeIds = Array.isArray(value) ? value : [value]
      
      if (selectedGradeIds.length === 0) return true
      
      return selectedGradeIds.includes(alumno.grade_id)
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const alumno = row.original
      const config = statusConfig[alumno.status]
      
      return (
        <Badge variant={config.variant} className={config.className}>
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const alumno = row.original as any
      return value.includes(alumno.status)
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Creado' />
    ),
    cell: ({ row }) => {
      const alumno = row.original
      return (
        <div className='text-sm text-muted-foreground'>
          {new Date(alumno.created_at).toLocaleDateString('es-ES')}
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]

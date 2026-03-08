import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { Building2, Settings } from 'lucide-react'
import { colegioStatuses } from '../data/data'
import { type Colegio } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

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
}

export const colegiosColumns: ColumnDef<Colegio>[] = [
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
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      return (
        <div className='font-medium'>
          {row.getValue('name')}
        </div>
      )
    },
  },
  {
    accessorKey: 'code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Code' />
    ),
    cell: ({ row }) => {
      return (
        <div className='max-w-[100px] truncate font-mono'>
          {row.getValue('code')}
        </div>
      )
    },
  },
  {
    accessorKey: 'address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Address' />
    ),
    cell: ({ row }) => {
      return (
        <LongText className='max-w-[200px]'>
          {row.getValue('address')}
        </LongText>
      )
    },
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Phone' />
    ),
    cell: ({ row }) => {
      return (
        <div className='max-w-[120px] truncate'>
          {row.getValue('phone')}
        </div>
      )
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => {
      return (
        <div className='max-w-[180px] truncate'>
          {row.getValue('email')}
        </div>
      )
    },
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
    id: 'academic_settings',
    header: 'Configuración',
    cell: ({ row }) => {
      const colegio = row.original
      return (
        <Link to={`/gestion/colegios/${colegio.id}/academic-settings`}>
          <Button variant='outline' size='sm'>
            <Settings className='h-4 w-4 mr-2' />
            Ajustes Académicos
          </Button>
        </Link>
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

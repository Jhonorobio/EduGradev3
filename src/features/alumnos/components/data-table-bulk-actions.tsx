import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Trash2, Download } from 'lucide-react'
import { Alumno } from '../data/schema'

interface DataTableBulkActionsProps<TData> {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows

  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='outline'
        size='sm'
        onClick={() => {
          // Handle bulk delete
          console.log('Delete selected:', selectedRows.map(row => row.original))
        }}
        className='text-red-600 hover:text-red-700'
      >
        <Trash2 className='mr-2 h-4 w-4' />
        Delete ({selectedRows.length})
      </Button>
      <Button
        variant='outline'
        size='sm'
        onClick={() => {
          // Handle bulk export
          console.log('Export selected:', selectedRows.map(row => row.original))
        }}
      >
        <Download className='mr-2 h-4 w-4' />
        Export ({selectedRows.length})
      </Button>
    </div>
  )
}

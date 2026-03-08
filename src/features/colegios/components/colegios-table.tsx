import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { DataTablePagination } from '@/components/data-table'
import { type Colegio } from '../data/schema'
import { colegiosColumns } from './colegios-columns'

interface ColegiosTableProps {
  data: Colegio[]
  search: string
  navigate: any
  loading?: boolean
}

export function ColegiosTable({ data, search, navigate, loading = false }: ColegiosTableProps) {
  const columns = colegiosColumns

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
  })

  return (
    <div className='space-y-4'>
      <div className='rounded-md border'>
        <div className='relative w-full overflow-auto'>
          <table className='w-full caption-bottom text-sm'>
            <thead className='[&_tr]:border-b'>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className='hover:bg-muted/50'>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        className={`
                          h-12 px-4 text-left align-middle font-medium text-muted-foreground
                          [&:has([role=checkbox])]:pr-0
                          ${header.column.getCanSort() ? 'cursor-pointer' : ''}
                        `}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className='[&_tr:last-child]:border-0'>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className='h-24 text-center'>
                    <div className='flex items-center justify-center'>
                      <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
                      <span className='ml-2'>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`
                          p-4 align-middle [&:has([role=checkbox])]:pr-0
                          ${cell.column.columnDef.meta?.className || ''}
                        `}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className='h-24 text-center'>
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}

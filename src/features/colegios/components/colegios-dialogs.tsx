import { ColegiosActionDialog } from './colegios-action-dialog'
import { ColegiosDeleteDialog } from './colegios-delete-dialog'
import { useColegios } from './colegios-provider'

export function ColegiosDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useColegios()
  return (
    <>
      <ColegiosActionDialog
        key='colegio-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <ColegiosActionDialog
            key={`colegio-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <ColegiosDeleteDialog
            key={`colegio-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}

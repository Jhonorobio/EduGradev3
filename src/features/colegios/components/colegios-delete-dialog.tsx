import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteColegio } from '@/services/colegios'
import { toast } from 'sonner'
import { type Colegio } from '../data/schema'

type ColegioDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Colegio
}

export function ColegiosDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: ColegioDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await deleteColegio(currentRow.id)
      toast.success('Colegio eliminado correctamente')
      onOpenChange(false)
      window.location.reload()
    } catch (error) {
      console.error('Error deleting colegio:', error)
      toast.error('Error al eliminar el colegio')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the colegio{' '}
            <span className='font-medium'>{currentRow.name}</span> and remove all
            associated data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

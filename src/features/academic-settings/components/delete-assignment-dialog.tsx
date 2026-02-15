import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'

interface DeleteAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignmentName: string
  onConfirm: () => void
  loading?: boolean
}

export function DeleteAssignmentDialog({ 
  open, 
  onOpenChange, 
  assignmentName, 
  onConfirm, 
  loading = false 
}: DeleteAssignmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar Eliminación
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar la asignación <strong>"{assignmentName}"</strong>?
            <br />
            <br />
            Esta acción no se puede deshacer y afectará la programación académica.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

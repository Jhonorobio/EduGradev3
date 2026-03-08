import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAlumnosStore } from '../store/alumnos-store'

interface AlumnosDeleteDialogProps {
  open: boolean
}

export function AlumnosDeleteDialog({ open }: AlumnosDeleteDialogProps) {
  const { setIsDeleteDialogOpen, currentAlumno } = useAlumnosStore()

  const handleDelete = () => {
    // Mock delete - en producción esto iría a una API real
    console.log('Deleting alumno:', currentAlumno)
    setIsDeleteDialogOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Estás seguro?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente al alumno
            {currentAlumno && ` ${currentAlumno.name} ${currentAlumno.last_name}`} del sistema.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => setIsDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button variant='destructive' onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

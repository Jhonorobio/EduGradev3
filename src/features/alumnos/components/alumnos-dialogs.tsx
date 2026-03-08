import { AlumnosNewDialog } from './alumnos-new-dialog'
import { AlumnosEditDialog } from './alumnos-edit-dialog'
import { AlumnosDeleteDialog } from './alumnos-delete-dialog'
import { useAlumnosStore } from '../store/alumnos-store'

export function AlumnosDialogs() {
  const { isNewDialogOpen, isEditDialogOpen, isDeleteDialogOpen } = useAlumnosStore()

  return (
    <>
      <AlumnosNewDialog open={isNewDialogOpen} />
      <AlumnosEditDialog open={isEditDialogOpen} />
      <AlumnosDeleteDialog open={isDeleteDialogOpen} />
    </>
  )
}

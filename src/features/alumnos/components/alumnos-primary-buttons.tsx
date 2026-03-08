import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useAlumnosStore } from '../store/alumnos-store'

export function AlumnosPrimaryButtons() {
  const setIsNewDialogOpen = useAlumnosStore((state) => state.setIsNewDialogOpen)

  return (
    <Button
      className='text-xs md:text-sm'
      onClick={() => setIsNewDialogOpen(true)}
    >
      <Plus className='mr-2 h-4 w-4' />
      Add Alumno
    </Button>
  )
}

import { create } from 'zustand'
import { Alumno } from '../data/schema'

interface AlumnosState {
  currentAlumno: Alumno | null
  isEditDialogOpen: boolean
  isDeleteDialogOpen: boolean
  isNewDialogOpen: boolean
  setCurrentAlumno: (alumno: Alumno | null) => void
  setIsEditDialogOpen: (open: boolean) => void
  setIsDeleteDialogOpen: (open: boolean) => void
  setIsNewDialogOpen: (open: boolean) => void
  reset: () => void
}

export const useAlumnosStore = create<AlumnosState>()((set) => ({
  currentAlumno: null,
  isEditDialogOpen: false,
  isDeleteDialogOpen: false,
  isNewDialogOpen: false,
  setCurrentAlumno: (alumno) => set({ currentAlumno: alumno }),
  setIsEditDialogOpen: (open) => set({ isEditDialogOpen: open }),
  setIsDeleteDialogOpen: (open) => set({ isDeleteDialogOpen: open }),
  setIsNewDialogOpen: (open) => set({ isNewDialogOpen: open }),
  reset: () =>
    set({
      currentAlumno: null,
      isEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isNewDialogOpen: false,
    }),
}))

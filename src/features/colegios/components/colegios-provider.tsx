import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Colegio } from '@/types/colegio'

type ColegiosDialogType = 'add' | 'edit' | 'delete'

type ColegiosContextType = {
  open: ColegiosDialogType | null
  setOpen: (str: ColegiosDialogType | null) => void
  currentRow: Colegio | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Colegio | null>>
}

const ColegiosContext = React.createContext<ColegiosContextType | null>(null)

export function ColegiosProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ColegiosDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Colegio | null>(null)

  return (
    <ColegiosContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ColegiosContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useColegios = () => {
  const colegiosContext = React.useContext(ColegiosContext)

  if (!colegiosContext) {
    throw new Error('useColegios has to be used within <ColegiosContext>')
  }

  return colegiosContext
}

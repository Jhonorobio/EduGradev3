'use client'

import React, { ReactNode } from 'react'
import { useAlumnosStore } from '../store/alumnos-store'

interface AlumnosProviderProps {
  children: ReactNode
}

export function AlumnosProvider({ children }: AlumnosProviderProps) {
  const reset = useAlumnosStore((state) => state.reset)

  // Reset store when provider unmounts
  React.useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  return <>{children}</>
}

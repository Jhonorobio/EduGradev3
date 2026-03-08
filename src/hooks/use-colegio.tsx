import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface ColegioContextType {
  selectedColegio: string | null
  setSelectedColegio: (colegioId: string | null) => void
  colegioInfo: {
    id: string
    name: string
    code: string
  } | null
}

const ColegioContext = createContext<ColegioContextType | undefined>(undefined)

interface ColegioProviderProps {
  children: ReactNode
}

export function ColegioProvider({ children }: ColegioProviderProps) {
  const [selectedColegio, setSelectedColegioState] = useState<string | null>(null)
  
  const setSelectedColegio = (colegioId: string | null) => {
    setSelectedColegioState(colegioId)
    // Also save to localStorage for persistence
    if (colegioId) {
      localStorage.setItem('selectedColegio', colegioId)
    } else {
      localStorage.removeItem('selectedColegio')
    }
  }

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedColegio')
    if (saved) {
      setSelectedColegioState(saved)
    }
  }, [])

  const getColegioInfo = (id: string) => {
    const mockInfo: Record<string, { name: string; code: string }> = {
      '1': { name: 'Colegio San José', code: 'CSJ001' },
      '2': { name: 'Colegio María Auxiliadora', code: 'CMA002' },
      '3': { name: 'Colegio La Salle', code: 'CLS003' }
    }
    return mockInfo[id] || { name: 'Colegio Desconocido', code: 'UNKNOWN' }
  }

  const info = selectedColegio ? {
    id: selectedColegio,
    ...getColegioInfo(selectedColegio)
  } : null

  return (
    <ColegioContext.Provider value={{
      selectedColegio,
      setSelectedColegio,
      colegioInfo: info
    }}>
      {children}
    </ColegioContext.Provider>
  )
}

export function useColegio() {
  const context = useContext(ColegioContext)
  if (context === undefined) {
    throw new Error('useColegio debe ser usado dentro de un ColegioProvider')
  }
  return context
}

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users } from 'lucide-react'
import { useColegio } from '@/hooks/use-colegio'

interface Colegio {
  id: string
  name: string
  code: string
}

interface ColegioSelectorProps {
  className?: string
}

export function ColegioSelector({ className }: ColegioSelectorProps) {
  const { selectedColegio, setSelectedColegio } = useColegio()
  const [colegios, setColegios] = useState<Colegio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carga de colegios
    setTimeout(() => {
      setColegios([
        { id: '1', name: 'Colegio San José', code: 'CSJ001' },
        { id: '2', name: 'Colegio María Auxiliadora', code: 'CMA002' },
        { id: '3', name: 'Colegio La Salle', code: 'CLS003' }
      ])
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className='p-4'>
          <div className='flex items-center gap-2'>
            <Building2 className='h-4 w-4 animate-spin' />
            <span className='text-sm'>Cargando colegios...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <CardTitle className='text-sm font-medium flex items-center gap-2'>
          <Building2 className='h-4 w-4' />
          Colegio Actual
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0'>
        <Select value={selectedColegio || ''} onValueChange={setSelectedColegio}>
          <SelectTrigger>
            <SelectValue placeholder='Selecciona un colegio' />
          </SelectTrigger>
          <SelectContent>
            {colegios.map((colegio) => (
              <SelectItem key={colegio.id} value={colegio.id}>
                <div className='flex items-center gap-2'>
                  <Building2 className='h-4 w-4' />
                  <div>
                    <div className='font-medium'>{colegio.name}</div>
                    <div className='text-xs text-muted-foreground'>{colegio.code}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedColegio && (
          <div className='mt-3 text-xs text-muted-foreground'>
            <div className='flex items-center gap-1'>
              <Users className='h-3 w-3' />
              <span>Gestionando datos del colegio seleccionado</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

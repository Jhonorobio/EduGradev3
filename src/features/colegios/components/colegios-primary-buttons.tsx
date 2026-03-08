import { Button } from '@/components/ui/button'
import { Plus, Building2 } from 'lucide-react'
import { useColegios } from './colegios-provider'

export function ColegiosPrimaryButtons() {
  const { setOpen } = useColegios()

  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='default'
        size='sm'
        className='h-8 gap-1'
        onClick={() => setOpen('add')}
      >
        <Plus className='h-3.5 w-3.5' />
        Add Colegio
      </Button>
    </div>
  )
}

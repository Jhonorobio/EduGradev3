import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Subject } from '@/services/subjects'
import { useState, useEffect } from 'react'

interface SubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject?: Subject | null
  onSave: (subject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>) => void
  onUpdate?: (id: string, subject: Partial<Subject>) => void
  loading?: boolean
}

const AVAILABLE_LEVELS = [
  { id: 'Primaria', label: 'Primaria' },
  { id: 'Bachillerato', label: 'Bachillerato' }
] as const

export function SubjectDialog({ 
  open, 
  onOpenChange, 
  subject, 
  onSave, 
  onUpdate, 
  loading = false 
}: SubjectDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    levels: [] as ('Primaria' | 'Bachillerato')[]
  })

  const isEditing = !!subject

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || '',
        code: subject.code || '',
        levels: subject.levels || []
      })
    } else {
      setFormData({
        name: '',
        code: '',
        levels: []
      })
    }
  }, [subject, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.code.trim() || formData.levels.length === 0) {
      return
    }

    if (isEditing && onUpdate && subject) {
      onUpdate(subject.id, formData)
    } else {
      onSave(formData)
    }
  }

  const handleLevelChange = (level: 'Primaria' | 'Bachillerato', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      levels: checked 
        ? [...prev.levels, level]
        : prev.levels.filter(l => l !== level)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Materia' : 'Nueva Materia'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos de la materia seleccionada.'
              : 'Completa los datos para crear una nueva materia.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Materia</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Matemáticas"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="Ej: MAT101"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Niveles Educativos</Label>
            <div className="space-y-2">
              {AVAILABLE_LEVELS.map((level) => (
                <div key={level.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={level.id}
                    checked={formData.levels.includes(level.id)}
                    onCheckedChange={(checked) => 
                      handleLevelChange(level.id, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={level.id} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {level.label}
                  </Label>
                </div>
              ))}
            </div>
            {formData.levels.length === 0 && (
              <p className="text-sm text-destructive">
                Debes seleccionar al menos un nivel educativo
              </p>
            )}
          </div>

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
              type="submit" 
              disabled={loading || formData.levels.length === 0}
            >
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

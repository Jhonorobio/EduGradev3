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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Grade } from '@/services/grades'
import { getTeachers, User } from '@/services/users'
import { useState, useEffect } from 'react'

interface GradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  grade?: Grade | null
  onSave: (grade: Omit<Grade, 'id' | 'created_at' | 'updated_at'>) => void
  onUpdate?: (id: string, grade: Partial<Grade>) => void
  loading?: boolean
}

export function GradeDialog({ 
  open, 
  onOpenChange, 
  grade, 
  onSave, 
  onUpdate, 
  loading = false 
}: GradeDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    level: 'Primaria' as 'Primaria' | 'Bachillerato',
    groupDirector: ''
  })
  const [teachers, setTeachers] = useState<User[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)

  const isEditing = !!grade

  useEffect(() => {
    if (grade) {
      setFormData({
        name: grade.name,
        level: grade.level,
        groupDirector: grade.groupDirector || 'no-director'
      })
    } else {
      setFormData({
        name: '',
        level: 'Primaria',
        groupDirector: 'no-director'
      })
    }
  }, [grade, open])

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoadingTeachers(true)
        const teachersData = await getTeachers()
        setTeachers(teachersData)
      } catch (error) {
        console.error('Error loading teachers:', error)
      } finally {
        setLoadingTeachers(false)
      }
    }

    if (open) {
      loadTeachers()
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      return
    }

    // Convertir "no-director" a string vacía para el backend
    const submitData = {
      ...formData,
      groupDirector: formData.groupDirector === 'no-director' ? '' : formData.groupDirector
    }

    if (isEditing && onUpdate && grade) {
      onUpdate(grade.id, submitData)
    } else {
      onSave(submitData)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Grado' : 'Nuevo Grado'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos del grado seleccionado.'
              : 'Completa los datos para crear un nuevo grado.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Grado</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Primero de Primaria"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Nivel Educativo</Label>
            <Select 
              value={formData.level} 
              onValueChange={(value: 'Primaria' | 'Bachillerato') => 
                setFormData(prev => ({ ...prev, level: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Primaria">Primaria</SelectItem>
                <SelectItem value="Bachillerato">Bachillerato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupDirector">Director de Grupo (Opcional)</Label>
            <Select 
              value={formData.groupDirector} 
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, groupDirector: value }))
              }
              disabled={loadingTeachers}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTeachers ? "Cargando docentes..." : "Selecciona un docente (opcional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-director">Sin director asignado</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.name}>
                    {teacher.name}
                  </SelectItem>
                ))}
                {teachers.length === 0 && !loadingTeachers && (
                  <SelectItem value="no-teachers" disabled>
                    No hay docentes disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={loading || loadingTeachers}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

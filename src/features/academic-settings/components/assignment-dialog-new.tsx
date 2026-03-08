import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Assignment } from '@/services/assignments'
import { User } from '@/types/auth'
import { Subject } from '@/services/subjects'
import { Grade } from '@/services/grades'

interface AssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment?: Assignment | null
  onSave: (assignment: any) => void
  onUpdate?: (id: string, assignment: Partial<Assignment>) => void
  subjects: Subject[]
  grades: Grade[]
  teachers: User[]
  loadingTeachers?: boolean
}

export function AssignmentDialog({ 
  open, 
  onOpenChange, 
  assignment, 
  onSave, 
  onUpdate,
  subjects,
  grades,
  teachers,
  loadingTeachers
}: AssignmentDialogProps) {
  const [formData, setFormData] = useState({
    teacher_id: '',
    subject_id: '',
    grade_ids: [] as string[]
  })

  const isEditing = !!assignment

  useEffect(() => {
    if (assignment) {
      setFormData({
        teacher_id: assignment.teacher_id,
        subject_id: assignment.subject_id,
        grade_ids: assignment.grade_ids || (assignment.grade_id ? [assignment.grade_id] : [])
      })
    } else {
      setFormData({
        teacher_id: '',
        subject_id: '',
        grade_ids: []
      })
    }
  }, [assignment, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.teacher_id || !formData.subject_id || formData.grade_ids.length === 0) {
      return
    }

    if (isEditing && onUpdate && assignment) {
      // For editing, pass all grade_ids together
      onUpdate(assignment.id, {
        teacher_id: formData.teacher_id,
        subject_id: formData.subject_id,
        grade_ids: formData.grade_ids
      })
    } else {
      // For creating, pass all grade_ids to create a single assignment
      onSave(formData)
    }
    onOpenChange(false)
  }

  const handleGradeToggle = (gradeId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      grade_ids: checked 
        ? [...prev.grade_ids, gradeId]
        : prev.grade_ids.filter(id => id !== gradeId)
    }))
  }

  const selectedSubject = subjects.find(s => s.id === formData.subject_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Asignación' : 'Nueva Asignación'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos de la asignación seleccionada.'
              : 'Selecciona el profesor, materia y los grados donde enseñará.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Profesor</Label>
            <Select 
              value={formData.teacher_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, teacher_id: value }))}
              disabled={loadingTeachers}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTeachers ? "Cargando..." : "Selecciona un profesor"} />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Materia</Label>
            <Select 
              value={formData.subject_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, subject_id: value, grade_ids: [] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una materia" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSubject && (
              <p className="text-xs text-muted-foreground">
                Niveles: {selectedSubject.levels.join(', ')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Grados donde enseñará</Label>
            <div className="border rounded-md max-h-60 overflow-y-auto p-2 space-y-2">
              {grades
                .filter(grade => {
                  if (!selectedSubject) return true
                  return selectedSubject.levels.includes(grade.level)
                })
                .map((grade) => (
                <div key={grade.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={grade.id}
                    checked={formData.grade_ids.includes(grade.id)}
                    onCheckedChange={(checked) => handleGradeToggle(grade.id, checked as boolean)}
                  />
                  <Label 
                    htmlFor={grade.id} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {grade.name} ({grade.level})
                  </Label>
                </div>
              ))}
            </div>
            {formData.grade_ids.length === 0 && (
              <p className="text-sm text-destructive">
                Debes seleccionar al menos un grado
              </p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.teacher_id || !formData.subject_id || formData.grade_ids.length === 0}
            >
              {isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

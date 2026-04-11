import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Assignment } from '@/services/assignments'
import { getTeachers } from '@/services/users'
import { getSubjects } from '@/services/subjects'
import { getGradesByColegio } from '@/services/grades'
import { User } from '@/types/auth'
import { Subject } from '@/services/subjects'
import { Grade } from '@/services/grades'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

interface AssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment?: Assignment | null
  onSave: (assignment: any) => void
  saving?: boolean
  colegioId: string
}

export function AssignmentDialog({ open, onOpenChange, assignment, onSave, saving, colegioId }: AssignmentDialogProps) {
  const [formData, setFormData] = useState({
    teacher_id: '',
    subject_id: '',
    grade_ids: [] as string[],
    colegio_id: ''
  })
  const [teachers, setTeachers] = useState<User[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(true)
  const [showGradesDropdown, setShowGradesDropdown] = useState(false)

  const isEditing = !!assignment

  useEffect(() => {
    const loadData = async () => {
      if (!colegioId) return
      try {
        const [teachersData, subjectsData, gradesData] = await Promise.all([
          getTeachers(),
          getSubjects(),
          getGradesByColegio(colegioId)
        ])
        setTeachers(teachersData)
        setSubjects(subjectsData)
        setGrades(gradesData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoadingTeachers(false)
        setLoadingSubjects(false)
        setLoadingGrades(false)
      }
    }

    if (open) {
      loadData()
    }
  }, [open])

  useEffect(() => {
    if (assignment) {
      setFormData({
        teacher_id: assignment.teacher_id || '',
        subject_id: assignment.subject_id || '',
        grade_ids: assignment.grade_ids || [],
        colegio_id: assignment.colegio_id || ''
      })
    } else {
      setFormData({
        teacher_id: '',
        subject_id: '',
        grade_ids: [],
        colegio_id: ''
      })
    }
  }, [assignment, open])

  const handleGradeToggle = (gradeId: string) => {
    setFormData(prev => {
      const currentGrades = prev.grade_ids
      if (currentGrades.includes(gradeId)) {
        return { ...prev, grade_ids: currentGrades.filter(id => id !== gradeId) }
      } else {
        return { ...prev, grade_ids: [...currentGrades, gradeId] }
      }
    })
  }

  const handleRemoveGrade = (gradeId: string) => {
    setFormData(prev => ({
      ...prev,
      grade_ids: prev.grade_ids.filter(id => id !== gradeId)
    }))
  }

  const getSelectedGradeNames = () => {
    return formData.grade_ids.map(id => {
      const grade = grades.find(g => g.id === id)
      return grade?.name || id
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.teacher_id || !formData.subject_id || formData.grade_ids.length === 0) {
      return
    }

    const dataToSave = {
      ...formData,
      // Para compatibilidad con la BD, usamos el primer grado como grade_id
      grade_id: formData.grade_ids[0]
    }

    if (isEditing && assignment) {
      onSave({ ...dataToSave, id: assignment.id })
    } else {
      onSave(dataToSave)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Asignación' : 'Nueva Asignación'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos de la asignación seleccionada.'
              : 'Selecciona el profesor, la materia y los grados que enseñará.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacher">Profesor</Label>
                <Select
                  value={formData.teacher_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, teacher_id: value }))}
                  disabled={loadingTeachers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar profesor" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                    {teachers.length === 0 && !loadingTeachers && (
                      <SelectItem value="no-teachers" disabled>
                        No hay profesores disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Materia</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subject_id: value }))}
                  disabled={loadingSubjects}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                    {subjects.length === 0 && !loadingSubjects && (
                      <SelectItem value="no-subjects" disabled>
                        No hay materias disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Grados</Label>
              <div className="border rounded-md p-3">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowGradesDropdown(!showGradesDropdown)}
                >
                  <div className="flex flex-wrap gap-1">
                    {formData.grade_ids.length === 0 ? (
                      <span className="text-muted-foreground text-sm">Seleccionar grados...</span>
                    ) : (
                      getSelectedGradeNames().map((name, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                          {name}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveGrade(formData.grade_ids[idx])
                            }}
                          />
                        </Badge>
                      ))
                    )}
                  </div>
                  {showGradesDropdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                
                {showGradesDropdown && (
                  <div className="mt-3 pt-3 border-t max-h-[200px] overflow-y-auto">
                    <div className="space-y-2">
                      {grades.map((grade) => (
                        <div key={grade.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`grade-${grade.id}`}
                            checked={formData.grade_ids.includes(grade.id)}
                            onCheckedChange={() => handleGradeToggle(grade.id)}
                          />
                          <Label 
                            htmlFor={`grade-${grade.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {grade.name}
                          </Label>
                        </div>
                      ))}
                      {grades.length === 0 && !loadingGrades && (
                        <p className="text-sm text-muted-foreground">No hay grados disponibles</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Selecciona uno o más grados para esta asignación
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || formData.grade_ids.length === 0}>
              {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

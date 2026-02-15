import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Assignment } from '@/services/assignments'
import { getTeachers } from '@/services/users'
import { getSubjects } from '@/services/subjects'
import { getGrades } from '@/services/grades'
import { User } from '@/types/auth'
import { Subject } from '@/services/subjects'
import { Grade } from '@/services/grades'

interface AssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment?: Assignment | null
  onSave: (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at' | 'teacherName' | 'subjectName' | 'gradeName'>) => void
  onUpdate?: (id: string, assignment: Partial<Assignment>) => void
}

export function AssignmentDialog({ open, onOpenChange, assignment, onSave, onUpdate }: AssignmentDialogProps) {
  const [formData, setFormData] = useState({
    teacherId: '',
    subjectId: '',
    gradeId: '',
    section: '',
    period: 1,
    status: 'active' as 'active' | 'pending' | 'inactive',
    schedule: ''
  })
  const [teachers, setTeachers] = useState<User[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(true)

  const isEditing = !!assignment

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teachersData, subjectsData, gradesData] = await Promise.all([
          getTeachers(),
          getSubjects(),
          getGrades()
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
        teacherId: assignment.teacherId,
        subjectId: assignment.subjectId,
        gradeId: assignment.gradeId,
        section: assignment.section,
        period: assignment.period,
        status: assignment.status,
        schedule: assignment.schedule
      })
    } else {
      setFormData({
        teacherId: '',
        subjectId: '',
        gradeId: '',
        section: '',
        period: 1,
        status: 'active',
        schedule: ''
      })
    }
  }, [assignment, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.teacherId || !formData.subjectId || !formData.gradeId || !formData.section.trim()) {
      return
    }

    if (isEditing && onUpdate && assignment) {
      onUpdate(assignment.id, formData)
    } else {
      onSave(formData)
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
              : 'Completa los datos para crear una nueva asignación.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacher">Profesor</Label>
                <Select
                  value={formData.teacherId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, teacherId: value }))}
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
                  value={formData.subjectId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grado</Label>
                <Select
                  value={formData.gradeId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gradeId: value }))}
                  disabled={loadingGrades}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grado" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                    {grades.length === 0 && !loadingGrades && (
                      <SelectItem value="no-grades" disabled>
                        No hay grados disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Sección</Label>
                <Input
                  id="section"
                  value={formData.section}
                  onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                  placeholder="Ej: A, B, C"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period">Periodo</Label>
                <Select
                  value={formData.period.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, period: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Primer Periodo</SelectItem>
                    <SelectItem value="2">Segundo Periodo</SelectItem>
                    <SelectItem value="3">Tercer Periodo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'pending' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="inactive">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Horario</Label>
              <Textarea
                id="schedule"
                value={formData.schedule}
                onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                placeholder="Ej: Lunes, Miércoles, Viernes 8:00-9:30"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

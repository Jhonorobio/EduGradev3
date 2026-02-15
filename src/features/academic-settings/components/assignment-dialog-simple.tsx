"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Assignment, getSubjects, getGrades, createAssignment, updateAssignment, deleteAssignment, getAssignmentsByTeacher } from "@/services/assignments"
import { Loader2 } from "lucide-react"

interface AssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment?: Assignment | null
  teacherId: string
  teacherName?: string
}

export function AssignmentDialog({ open, onOpenChange, assignment, teacherId, teacherName }: AssignmentDialogProps) {
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [grades, setGrades] = useState<{ id: string; name: string }[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isEditing = !!assignment

  useEffect(() => {
    if (open) {
      loadData()
      if (isEditing && assignment) {
        setSelectedSubject(assignment.subject_id)
        // Para edición, mostrar todos los grados de esta materia para este profesor
        loadAllGradesForSubject(assignment.subject_id)
      } else {
        setSelectedSubject("")
        setSelectedGrades([])
      }
    }
  }, [open, assignment, isEditing])

  const loadData = async () => {
    setLoading(true)
    try {
      const [subjectsData, gradesData] = await Promise.all([
        getSubjects(),
        getGrades()
      ])
      setSubjects(subjectsData)
      setGrades(gradesData)
    } catch (error) {
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const loadAllGradesForSubject = async (subjectId: string) => {
    try {
      const allAssignments = await getAssignmentsByTeacher(teacherId)
      const subjectAssignments = allAssignments.filter(a => a.subject_id === subjectId)
      const gradeIds = subjectAssignments.map(a => a.grade_id)
      setSelectedGrades(gradeIds)
    } catch (error) {
      console.error('Error loading grades for subject:', error)
    }
  }

  const handleGradeToggle = (gradeId: string) => {
    setSelectedGrades(prev => 
      prev.includes(gradeId) 
        ? prev.filter(id => id !== gradeId)
        : [...prev, gradeId]
    )
  }

  const handleSubmit = async () => {
    if (!selectedSubject || selectedGrades.length === 0) {
      toast.error("Selecciona una materia y al menos un grado")
      return
    }

    setSubmitting(true)
    try {
      if (isEditing && assignment) {
        // Para edición, necesitamos obtener todas las asignaciones actuales
        const allAssignments = await getAssignmentsByTeacher(teacherId)
        const subjectAssignments = allAssignments.filter(a => a.subject_id === assignment.subject_id)
        
        // Eliminar las asignaciones actuales
        for (const existingAssignment of subjectAssignments) {
          await deleteAssignment(existingAssignment.id)
        }
        
        // Crear las nuevas asignaciones con los grados seleccionados
        const promises = selectedGrades.map(gradeId => 
          createAssignment({
            teacher_id: teacherId,
            subject_id: selectedSubject,
            grade_id: gradeId
          })
        )

        await Promise.all(promises)
        toast.success(`Asignación actualizada: ${selectedGrades.length} grado${selectedGrades.length > 1 ? 's' : ''} modificado${selectedGrades.length > 1 ? 's' : ''}`)
      } else {
        // Para creación, creamos una asignación por cada grado seleccionado
        const promises = selectedGrades.map(gradeId => 
          createAssignment({
            teacher_id: teacherId,
            subject_id: selectedSubject,
            grade_id: gradeId
          })
        )

        await Promise.all(promises)
        toast.success(`Se ${selectedGrades.length > 1 ? 'crearon' : 'creó'} ${selectedGrades.length} asignación${selectedGrades.length > 1 ? 'es' : ''} correctamente`)
      }

      onOpenChange(false)
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error("Algunas asignaciones ya existen para este profesor")
      } else {
        toast.error(`Error al ${isEditing ? 'actualizar' : 'crear'} la asignación`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Asignación" : "Nueva Asignación"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? `Modificando las asignaciones de ${teacherName} para la materia seleccionada. Puedes agregar o quitar grados.`
              : `Agregar asignaciones para ${teacherName}. Selecciona una materia y los grados donde enseñará.`
            }
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selector de Materia */}
            <div className="space-y-2">
              <Label htmlFor="subject">Materia</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar materia" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Grados (Múltiple para creación, individual para edición) */}
            <div className="space-y-2">
              <Label>
                {isEditing ? "Grado" : "Grados"} 
                {!isEditing && selectedGrades.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedGrades.length} seleccionado{selectedGrades.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </Label>
              <div className="border rounded-md p-4">
                <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                  {grades.map(grade => (
                    <div key={grade.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={grade.id}
                        checked={selectedGrades.includes(grade.id)}
                        onCheckedChange={() => handleGradeToggle(grade.id)}
                        disabled={isEditing && selectedGrades.includes(grade.id) && selectedGrades[0] !== grade.id}
                      />
                      <Label htmlFor={grade.id} className="text-sm cursor-pointer leading-tight">
                        {grade.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {!isEditing && (
                <p className="text-xs text-muted-foreground">
                  Selecciona uno o más grados para esta materia. Los grados están ordenados por nivel educativo.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || loading || !selectedSubject || selectedGrades.length === 0}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Actualizar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

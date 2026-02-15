"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getTeachers, getSubjects, getGrades, getAssignmentsByTeacher, createAssignment, deleteAssignment } from "@/services/assignments"
import { User, Subject, Grade, Assignment } from "@/services/assignments"

interface TeacherAssignmentManagerProps {
  onClose?: () => void
}

export function TeacherAssignmentManager({ onClose }: TeacherAssignmentManagerProps) {
  const [teachers, setTeachers] = useState<User[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [currentAssignments, setCurrentAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedTeacher) {
      loadTeacherAssignments()
    }
  }, [selectedTeacher])

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
      toast.error("Error al cargar datos")
    }
  }

  const loadTeacherAssignments = async () => {
    if (!selectedTeacher) return
    
    setLoading(true)
    try {
      const assignments = await getAssignmentsByTeacher(selectedTeacher)
      setCurrentAssignments(assignments)
    } catch (error) {
      toast.error("Error al cargar asignaciones del profesor")
    } finally {
      setLoading(false)
    }
  }

  const handleGradeToggle = (gradeId: string) => {
    setSelectedGrades(prev => 
      prev.includes(gradeId) 
        ? prev.filter(id => id !== gradeId)
        : [...prev, gradeId]
    )
  }

  const handleAddAssignments = async () => {
    if (!selectedTeacher || !selectedSubject || selectedGrades.length === 0) {
      toast.error("Selecciona profesor, materia y al menos un grado")
      return
    }

    setLoading(true)
    try {
      // Crear asignaciones para cada grado seleccionado
      const promises = selectedGrades.map(gradeId => 
        createAssignment({
          teacher_id: selectedTeacher,
          subject_id: selectedSubject,
          grade_id: gradeId,
          status: 'active'
        })
      )

      await Promise.all(promises)
      toast.success(`Se agregaron ${selectedGrades.length} asignaciones correctamente`)
      
      // Resetear formulario y recargar
      setSelectedSubject("")
      setSelectedGrades([])
      loadTeacherAssignments()
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error("Algunas asignaciones ya existen")
      } else {
        toast.error("Error al agregar asignaciones")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await deleteAssignment(assignmentId)
      toast.success("Asignación eliminada correctamente")
      loadTeacherAssignments()
    } catch (error) {
      toast.error("Error al eliminar asignación")
    }
  }

  const getAssignmentsBySubject = (subjectId: string) => {
    return currentAssignments.filter(a => a.subject_id === subjectId)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Selector de Profesor */}
        <div className="space-y-2">
          <Label>Profesor</Label>
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar profesor" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map(teacher => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selector de Materia */}
        <div className="space-y-2">
          <Label>Materia</Label>
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

        {/* Selector de Grados (Múltiple) */}
        <div className="space-y-2">
          <Label>Grados</Label>
          <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
            {grades.map(grade => (
              <div key={grade.id} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={grade.id}
                  checked={selectedGrades.includes(grade.id)}
                  onCheckedChange={() => handleGradeToggle(grade.id)}
                />
                <Label htmlFor={grade.id} className="text-sm">
                  {grade.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botón de Agregar */}
      <div className="flex justify-between items-center">
        <Button 
          onClick={handleAddAssignments}
          disabled={loading || !selectedTeacher || !selectedSubject || selectedGrades.length === 0}
        >
          {loading ? "Agregando..." : `Agregar Asignaciones (${selectedGrades.length})`}
        </Button>
        
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </div>

      {/* Asignaciones Actuales del Profesor */}
      {selectedTeacher && (
        <Card>
          <CardHeader>
            <CardTitle>Asignaciones Actuales</CardTitle>
            <CardDescription>
              {teachers.find(t => t.id === selectedTeacher)?.name} - {currentAssignments.length} asignaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Cargando...</div>
            ) : currentAssignments.length === 0 ? (
              <p className="text-muted-foreground">No hay asignaciones registradas</p>
            ) : (
              <div className="space-y-4">
                {subjects.map(subject => {
                  const subjectAssignments = getAssignmentsBySubject(subject.id)
                  if (subjectAssignments.length === 0) return null

                  return (
                    <div key={subject.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{subject.name}</h4>
                        <Badge variant="secondary">{subjectAssignments.length} grados</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {subjectAssignments.map(assignment => {
                          const grade = grades.find(g => g.id === assignment.grade_id)
                          return (
                            <div key={assignment.id} className="flex items-center gap-2 bg-muted px-2 py-1 rounded">
                              <span className="text-sm">{grade?.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                className="h-4 w-4 p-0 hover:text-destructive"
                              >
                                ×
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

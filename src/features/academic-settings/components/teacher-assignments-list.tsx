"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AssignmentDialog } from "./assignment-dialog-simple"
import { Assignment, getTeachers, getAssignmentsByTeacher, deleteAssignment } from "@/services/assignments"
import { toast } from "sonner"
import { Users, Plus, BookOpen, GraduationCap, Trash2 } from "lucide-react"

interface TeacherAssignmentsListProps {
  onRefresh?: () => void
}

export function TeacherAssignmentsList({ onRefresh }: TeacherAssignmentsListProps) {
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<string>("")
  const [teacherAssignments, setTeacherAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)

  useEffect(() => {
    loadTeachers()
  }, [])

  useEffect(() => {
    if (selectedTeacher) {
      loadTeacherAssignments()
    } else {
      setTeacherAssignments([])
    }
  }, [selectedTeacher])

  const loadTeachers = async () => {
    try {
      const data = await getTeachers()
      setTeachers(data)
    } catch (error) {
      toast.error("Error al cargar los profesores")
    }
  }

  const loadTeacherAssignments = async () => {
    if (!selectedTeacher) return
    
    setLoading(true)
    try {
      const assignments = await getAssignmentsByTeacher(selectedTeacher)
      setTeacherAssignments(assignments)
    } catch (error) {
      toast.error("Error al cargar las asignaciones del profesor")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await deleteAssignment(assignmentId)
      toast.success("Asignación eliminada correctamente")
      loadTeacherAssignments()
      onRefresh?.()
    } catch (error) {
      toast.error("Error al eliminar la asignación")
    }
  }

  const handleAddAssignment = () => {
    setSelectedAssignment(null)
    setIsDialogOpen(true)
  }

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedAssignment(null)
    loadTeacherAssignments()
    onRefresh?.()
  }

  const getAssignmentsBySubject = (subjectId: string) => {
    return teacherAssignments.filter(a => a.subject_id === subjectId)
  }

  const selectedTeacherName = teachers.find(t => t.id === selectedTeacher)?.name

  return (
    <div className="space-y-6">
      {/* Selector de Profesor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seleccionar Profesor
          </CardTitle>
          <CardDescription>
            Elige un profesor para ver y gestionar sus asignaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Asignaciones del Profesor Seleccionado */}
      {selectedTeacher && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Asignaciones de {selectedTeacherName}
                </CardTitle>
                <CardDescription>
                  {teacherAssignments.length} asignaciones registradas
                </CardDescription>
              </div>
              <Button onClick={handleAddAssignment}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Asignación
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando asignaciones...</div>
            ) : teacherAssignments.length === 0 ? (
              <div className='text-center py-12'>
                <BookOpen className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
                <h3 className='text-lg font-semibold mb-2'>No hay asignaciones</h3>
                <p className='text-muted-foreground mb-4'>
                  Este profesor no tiene asignaciones registradas.
                </p>
                <Button onClick={handleAddAssignment}>
                  <Plus className='mr-2 h-4 w-4' />
                  Agregar Primera Asignación
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.from(new Set(teacherAssignments.map(a => a.subject_id))).map(subjectId => {
                  const subjectAssignments = getAssignmentsBySubject(subjectId)
                  const firstAssignment = subjectAssignments[0]
                  
                  return (
                    <div key={subjectId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-lg">{firstAssignment.subject_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {subjectAssignments.length} grado{subjectAssignments.length > 1 ? 's' : ''} asignado{subjectAssignments.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditAssignment(firstAssignment)}
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {subjectAssignments.map(assignment => (
                          <div key={assignment.id} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
                            <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium truncate">{assignment.grade_name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="h-6 w-6 p-0 hover:text-destructive flex-shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogo para Agregar/Editar Asignación */}
      <AssignmentDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        assignment={selectedAssignment}
        teacherId={selectedTeacher}
        teacherName={selectedTeacherName}
      />
    </div>
  )
}

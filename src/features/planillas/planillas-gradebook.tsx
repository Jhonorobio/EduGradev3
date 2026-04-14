import { useState, useEffect, useRef } from 'react'
import {
  getGradebookData,
  createActivity,
  upsertGradebookEntry,
  deleteActivity,
  getGradebookSettings,
} from '@/services/gradebook'
import {
  ArrowLeft,
  Users,
  BookOpen,
  Plus,
  Calculator,
  Trash2,
  MoreVertical,
  Edit,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatGradeInput, parseGradeInput } from '@/utils/grade-formatter'
import { useAuth } from '@/hooks/use-auth'
import { useStudentAverages } from '@/hooks/use-student-averages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface PlanillasGradebookProps {
  subjectId: string
  gradeId: string
  subjectName: string
  gradeName: string
  onBack: () => void
}

// Componente de input de calificación con soporte para decimales y navegación con Enter
interface GradeInputProps {
  studentId: string
  activityId: string
  activityMaxScore: number
  grade: number | undefined
  onGradeChange: (studentId: string, activityId: string, score: number) => void
  students: any[]
}

function GradeInput({
  studentId,
  activityId,
  activityMaxScore,
  grade,
  onGradeChange,
  students,
}: GradeInputProps) {
  const [inputValue, setInputValue] = useState<string>(formatGradeInput(grade))
  const inputRef = useRef<HTMLInputElement>(null)

  // Update local value when external grade changes (only when not focused)
  useEffect(() => {
    const newValue = formatGradeInput(grade)
    if (
      document.activeElement !== inputRef.current &&
      newValue !== inputValue
    ) {
      setInputValue(newValue)
    }
  }, [grade, inputValue])

  const commitValue = (value: string) => {
    const numericValue = parseGradeInput(value)
    if (numericValue >= 0 && numericValue <= activityMaxScore) {
      onGradeChange(studentId, activityId, numericValue)
      // Mostrar siempre con un decimal
      setInputValue(numericValue === 0 ? '' : numericValue.toFixed(1))
    } else {
      // Revert to saved value
      setInputValue(formatGradeInput(grade))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // Allow: empty, digits, and decimal numbers with . or ,
    // Examples: "9", "9.", "9.5", "0.5", "9,5"
    if (newValue === '' || /^\d*[.,]?\d{0,2}$/.test(newValue)) {
      setInputValue(newValue)
    }
  }

  const handleBlur = () => {
    commitValue(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitValue(inputValue)

      // Find next input in same column
      const currentIndex = students.findIndex((s) => s.id === studentId)
      if (currentIndex === -1) return

      const nextIndex =
        currentIndex + 1 < students.length ? currentIndex + 1 : 0
      const nextStudent = students[nextIndex]

      if (nextStudent) {
        const nextInputId = `grade-${nextStudent.id}-${activityId}`
        const nextInput = document.getElementById(
          nextInputId
        ) as HTMLInputElement
        if (nextInput) {
          nextInput.focus()
          nextInput.select()
        }
      }
    }
  }

  return (
    <input
      ref={inputRef}
      id={`grade-${studentId}-${activityId}`}
      type='text'
      inputMode='decimal'
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder='0.0'
      className='h-full w-full border-0 bg-transparent px-2 py-1 text-center text-sm focus:outline-none'
      style={{ minHeight: '40px' }}
    />
  )
}

export function PlanillasGradebook({
  subjectId,
  gradeId,
  subjectName,
  gradeName,
  onBack,
}: PlanillasGradebookProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>(
    {}
  )
  const [colegioSettings, setColegioSettings] = useState<any>(null)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [showEditActivity, setShowEditActivity] = useState(false)
  const [editingActivity, setEditingActivity] = useState<any>(null)
  const [newActivity, setNewActivity] = useState({
    name: '',
    category: 'apuntes_tareas' as any,
    max_score: 100,
    description: '',
  })

  // Use student averages hook
  const { getAverage, getClassAverage, getGradedCount } = useStudentAverages(
    students,
    activities,
    grades
  )

  const dynamicCategories = {
    apuntes_tareas: 'Apuntes y Tareas',
    talleres_exposiciones: 'Talleres y Exposiciones',
    actitudinal: 'Actitudinal',
    evaluacion: 'Evaluación',
  }

  useEffect(() => {
    loadGradebookData()
  }, [subjectId, gradeId])

  const loadGradebookData = async () => {
    try {
      setLoading(true)
      const data = await getGradebookData(subjectId, gradeId)

      console.log(
        `Found ${data.students.length} students and ${data.activities.length} activities`
      )
      setStudents(data.students)
      setActivities(data.activities)

      // Load colegio settings for the first student
      if (data.students.length > 0) {
        try {
          const settings = await getGradebookSettings(data.students[0].id)
          setColegioSettings(settings)
        } catch (error) {
          console.error('Error loading colegio settings:', error)
          // Continue without settings, use defaults
        }
      }

      // Set grades directly from gradebook data
      setGrades(data.grades || {})
    } catch (error) {
      console.error('Error loading gradebook data:', error)
      toast.error('Error al cargar los datos de la planilla')
    } finally {
      setLoading(false)
    }
  }

  const handleAddActivity = async () => {
    if (!newActivity.name.trim()) {
      toast.error('El nombre de la actividad es requerido')
      return
    }

    try {
      const activity = await createActivity({
        name: newActivity.name,
        category: newActivity.category,
        max_score: newActivity.max_score,
        description: newActivity.description,
        subject_id: subjectId,
        grade_id: gradeId,
        teacher_id: user!.id,
      })

      setActivities([...activities, activity])
      setNewActivity({
        name: '',
        category: 'apuntes_tareas',
        max_score: 100,
        description: '',
      })
      setShowAddActivity(false)
      toast.success('Actividad agregada exitosamente')
    } catch (error) {
      console.error('Error adding activity:', error)
      toast.error('Error al agregar la actividad')
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    try {
      await deleteActivity(activityId)
      setActivities(activities.filter((a) => a.id !== activityId))

      // Remove grades for this activity
      const updatedGrades = { ...grades }
      Object.keys(updatedGrades).forEach((studentId) => {
        delete updatedGrades[studentId][activityId]
      })
      setGrades(updatedGrades)

      toast.success('Actividad eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting activity:', error)
      toast.error('Error al eliminar la actividad')
    }
  }

  const handleEditActivity = (activity: any) => {
    setEditingActivity(activity)
    setShowEditActivity(true)
  }

  const handleUpdateActivity = async () => {
    if (!editingActivity) return

    try {
      // Aquí iría la lógica para actualizar la actividad
      toast.success('Actividad actualizada correctamente')
      setShowEditActivity(false)
      setEditingActivity(null)
      loadGradebookData() // Recargar datos
    } catch (error) {
      console.error('Error updating activity:', error)
      toast.error('Error al actualizar la actividad')
    }
  }

  const handleGradeChange = (
    studentId: string,
    activityId: string,
    score: number
  ) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [activityId]: score,
      },
    }))
  }

  const handleSaveGrades = async () => {
    try {
      setSaving(true)
      const savePromises: Promise<any>[] = []

      Object.entries(grades).forEach(([studentId, studentGrades]) => {
        Object.entries(studentGrades).forEach(([activityId, score]) => {
          savePromises.push(
            upsertGradebookEntry({
              student_id: studentId,
              activity_id: activityId,
              score,
              graded_by: user!.id,
            })
          )
        })
      })

      await Promise.all(savePromises)
      toast.success('Calificaciones guardadas exitosamente')
      await loadGradebookData() // Reload to get updated entries
    } catch (error) {
      console.error('Error saving grades:', error)
      toast.error('Error al guardar las calificaciones')
    } finally {
      setSaving(false)
    }
  }

  const getActivityGroup = (category: string) => {
    if (category === 'apuntes_tareas') {
      return 'apuntes_tareas'
    } else if (category === 'talleres_exposiciones') {
      return 'talleres_exposiciones'
    }
    return category
  }

  const getActivityGroupColor = (category: string) => {
    const group = getActivityGroup(category)
    return group === 'apuntes_tareas' ? 'text-blue-900' : 'text-gray-600'
  }

  const getActivityGroupLabel = (category: string) => {
    return (
      dynamicCategories[category as keyof typeof dynamicCategories] || category
    )
  }

  const getActivitiesByCategory = (category: string) => {
    return activities.filter((activity) => activity.category === category)
  }

  const getGradeForEntry = (
    studentId: string,
    activityId: string
  ): number | undefined => {
    return grades[studentId]?.[activityId]
  }

  if (loading) {
    return (
      <div className='flex min-h-96 items-center justify-center'>
        <div className='text-center'>
          <BookOpen className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
          <p className='text-muted-foreground'>
            Cargando planilla de calificaciones...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6 pb-20'>
      {/* Header */}
      <div className='flex items-center justify-between space-y-2'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='sm' onClick={onBack}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Volver a Planillas
          </Button>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Planilla de Calificaciones
            </h1>
            <p className='text-muted-foreground'>
              {subjectName} - {gradeName}
            </p>
          </div>
        </div>

        <Button onClick={handleSaveGrades} disabled={saving}>
          <Plus className='mr-2 h-4 w-4' />
          {saving ? 'Guardando...' : 'Guardar Calificaciones'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className='mb-6 grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Estudiantes</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{students.length}</div>
            <p className='text-xs text-muted-foreground'>
              Total de estudiantes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Actividades</CardTitle>
            <BookOpen className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{activities.length}</div>
            <p className='text-xs text-muted-foreground'>
              Actividades configuradas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Promedio General
            </CardTitle>
            <Calculator className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {getClassAverage.toFixed(1)}%
            </div>
            <p className='text-xs text-muted-foreground'>Promedio del grupo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Calificaciones
            </CardTitle>
            <BookOpen className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{getGradedCount}</div>
            <p className='text-xs text-muted-foreground'>
              Calificaciones ingresadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gradebook Table - Gradebook Tradicional */}
      <div className='overflow-x-auto'>
        <div className='overflow-hidden rounded-lg border'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='bg-gray-50'>
                <th className='w-12 rounded-tl-lg border border-gray-300 bg-gray-50 px-2 py-2 text-center'>
                  #
                </th>
                <th className='min-w-48 border border-gray-300 bg-gray-50 px-4 py-2 text-left'>
                  Estudiante
                </th>

                {/* Columnas de actividades individuales */}
                {activities.map((activity) => (
                  <th
                    key={activity.id}
                    className='relative border border-gray-300 bg-gray-50 px-4 py-2 text-left'
                  >
                    <div className='flex flex-col items-start gap-1'>
                      <div className='text-xs leading-none text-gray-500'>
                        {new Date(activity.created_at)
                          .toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                            timeZone: 'UTC',
                          })
                          .toUpperCase()}
                      </div>
                      <div
                        className='truncate text-sm leading-none font-medium'
                        title={activity.name}
                      >
                        {activity.name}
                      </div>
                      <div
                        className={`text-xs leading-none ${getActivityGroupColor(activity.category)}`}
                      >
                        {
                          dynamicCategories[
                            activity.category as keyof typeof dynamicCategories
                          ]
                        }
                      </div>
                    </div>
                    {/* Tres puntos en la esquina superior derecha */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className='absolute top-1 right-1 flex h-4 w-4 items-center justify-center text-gray-400 transition-colors hover:text-gray-600'>
                          <MoreVertical className='h-3 w-3' />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-32'>
                        <DropdownMenuItem
                          onClick={() => handleEditActivity(activity)}
                        >
                          <Edit className='mr-2 h-3 w-3' />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteActivity(activity.id)}
                          className='text-red-600 focus:text-red-600'
                        >
                          <Trash2 className='mr-2 h-3 w-3' />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </th>
                ))}

                {/* Columna Actitudinal */}
                <th className='w-24 border border-gray-300 bg-gray-50 px-2 py-2 text-center'>
                  <div className='text-sm leading-none font-medium'>
                    Actitudinal
                  </div>
                </th>

                {/* Columna Evaluación */}
                <th className='w-24 border border-gray-300 bg-gray-50 px-2 py-2 text-center'>
                  <div className='text-sm leading-none font-medium'>
                    Evaluación
                  </div>
                </th>

                {/* Columna Promedio */}
                <th className='w-20 rounded-tr-lg border border-gray-300 bg-gray-50 px-1 py-2 text-center'>
                  <div className='text-sm leading-none font-medium'>Final</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => {
                const average = getAverage(student.id)

                return (
                  <tr key={student.id} className='hover:bg-gray-50'>
                    <td className='w-12 rounded-bl-lg border border-gray-300 bg-white px-2 py-2 text-center font-medium'>
                      {index + 1}
                    </td>
                    <td className='border border-gray-300 bg-white px-4 py-2 text-left'>
                      <div>
                        <div className='font-medium'>{student.name}</div>
                        {student.last_name && (
                          <div className='text-sm text-muted-foreground'>
                            {student.last_name}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Columnas de actividades individuales */}
                    {activities.map((activity) => {
                      const grade = getGradeForEntry(student.id, activity.id)
                      return (
                        <td
                          key={activity.id}
                          className='border border-gray-300 bg-white p-0'
                        >
                          <GradeInput
                            studentId={student.id}
                            activityId={activity.id}
                            activityMaxScore={activity.max_score}
                            grade={grade}
                            onGradeChange={handleGradeChange}
                            students={students}
                          />
                        </td>
                      )
                    })}

                    {/* Columna Actitudinal - Fija */}
                    <td className='w-24 border border-gray-300 bg-white p-0'>
                      <GradeInput
                        studentId={student.id}
                        activityId='actitudinal'
                        activityMaxScore={10}
                        grade={grades[student.id]?.['actitudinal']}
                        onGradeChange={(studentId, activityId, score) => {
                          handleGradeChange(studentId, activityId, score)
                          // Save to backend
                          upsertGradebookEntry({
                            student_id: studentId,
                            activity_id: activityId,
                            score: score,
                            graded_by: user?.id,
                          }).catch((error) => {
                            console.error('Error saving grade:', error)
                            toast.error('Error al guardar la calificación')
                          })
                        }}
                        students={students}
                      />
                    </td>

                    {/* Columna Evaluación - Fija */}
                    <td className='w-24 border border-gray-300 bg-white p-0'>
                      <GradeInput
                        studentId={student.id}
                        activityId='evaluacion'
                        activityMaxScore={10}
                        grade={grades[student.id]?.['evaluacion']}
                        onGradeChange={(studentId, activityId, score) => {
                          handleGradeChange(studentId, activityId, score)
                          // Save to backend
                          upsertGradebookEntry({
                            student_id: studentId,
                            activity_id: activityId,
                            score: score,
                            graded_by: user?.id,
                          }).catch((error) => {
                            console.error('Error saving grade:', error)
                            toast.error('Error al guardar la calificación')
                          })
                        }}
                        students={students}
                      />
                    </td>

                    {/* Columna Promedio */}
                    <td className='w-20 rounded-br-lg border border-gray-300 bg-white px-1 py-1 font-medium'>
                      <div
                        className='flex h-full items-center justify-center'
                        style={{ minHeight: '40px' }}
                      >
                        <span className='text-sm font-medium'>
                          {average.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {students.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Sin Estudiantes
            </CardTitle>
            <CardDescription>
              No hay estudiantes inscritos en este grado
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <div className='text-center'>
              <Users className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
              <h3 className='mb-2 text-lg font-semibold'>
                No se encontraron estudiantes
              </h3>
              <p className='text-center text-muted-foreground'>
                Contacta al administrador para agregar estudiantes a este grado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Activity Dialog */}
      <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nueva Actividad</DialogTitle>
            <DialogDescription>
              Agrega una nueva actividad a la planilla de calificaciones
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='name'>Nombre de la Actividad</Label>
              <Input
                id='name'
                value={newActivity.name}
                onChange={(e) =>
                  setNewActivity((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder='Ej: Tarea 1'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='category'>Categoría</Label>
              <Select
                value={newActivity.category}
                onValueChange={(value: any) =>
                  setNewActivity((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dynamicCategories).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='max_score'>Puntaje Máximo</Label>
              <Input
                id='max_score'
                type='number'
                value={newActivity.max_score}
                onChange={(e) =>
                  setNewActivity((prev) => ({
                    ...prev,
                    max_score: parseFloat(e.target.value) || 0,
                  }))
                }
                min='0'
                step='0.01'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='description'>Descripción (Opcional)</Label>
              <Textarea
                id='description'
                value={newActivity.description}
                onChange={(e) =>
                  setNewActivity((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder='Descripción de la actividad...'
              />
            </div>
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setShowAddActivity(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddActivity}>Agregar Actividad</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Activity Dialog */}
      <Dialog open={showEditActivity} onOpenChange={setShowEditActivity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Actividad</DialogTitle>
            <DialogDescription>
              Modifica los datos de la actividad existente
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit-name'>Nombre de la Actividad</Label>
              <Input
                id='edit-name'
                value={editingActivity?.name || ''}
                onChange={(e) =>
                  setEditingActivity((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                placeholder='Ej: Tarea 1'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='edit-category'>Categoría</Label>
              <Select
                value={editingActivity?.category || ''}
                onValueChange={(value) =>
                  setEditingActivity((prev) =>
                    prev ? { ...prev, category: value } : null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Selecciona una categoría' />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dynamicCategories).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='edit-max-score'>Puntuación Máxima</Label>
              <Input
                id='edit-max-score'
                type='number'
                value={editingActivity?.max_score || ''}
                onChange={(e) =>
                  setEditingActivity((prev) =>
                    prev
                      ? { ...prev, max_score: parseFloat(e.target.value) }
                      : null
                  )
                }
                placeholder='100'
                min='0'
                max='100'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='edit-description'>Descripción</Label>
              <Textarea
                id='edit-description'
                value={editingActivity?.description || ''}
                onChange={(e) =>
                  setEditingActivity((prev) =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
                placeholder='Descripción opcional de la actividad'
                rows={3}
              />
            </div>
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => setShowEditActivity(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateActivity}>Actualizar Actividad</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Activity Button */}
      <div className='fixed right-6 bottom-6'>
        <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
          <DialogTrigger asChild>
            <Button size='lg' className='h-14 w-14 rounded-full'>
              <Plus className='h-6 w-6' />
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Debug Info */}
      <div className='overflow-hidden rounded-xl border border-gray-100 bg-card text-card-foreground'>
        <div className='px-6 py-4'>
          <h3 className='mb-3 text-lg font-semibold'>
            Información de Depuración
          </h3>
          <div className='space-y-1 text-sm'>
            <p>
              <strong>Subject ID:</strong> {subjectId}
            </p>
            <p>
              <strong>Grade ID:</strong> {gradeId}
            </p>
            <p>
              <strong>Subject Name:</strong> {subjectName}
            </p>
            <p>
              <strong>Grade Name:</strong> {gradeName}
            </p>
            <p>
              <strong>User:</strong> {user?.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

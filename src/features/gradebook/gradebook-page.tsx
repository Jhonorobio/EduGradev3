import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  getGradebookData,
  createActivity,
  upsertGradebookEntry,
  deleteActivity,
  Activity,
  Student,
} from '@/services/gradebook'
import {
  ArrowLeft,
  Users,
  BookOpen,
  Plus,
  Calculator,
  Save,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'

interface GradebookPageProps {
  subjectId: string
  gradeId: string
  subjectName: string
  gradeName: string
}

const categoryLabels = {
  apuntes_tareas: 'Apuntes y Tareas',
  talleres_exposiciones: 'Talleres y Exposiciones',
  actitudinal: 'Actitudinal',
  evaluacion: 'Evaluación',
}

// Componente de input de calificación con soporte para decimales y navegación con Enter
interface GradeInputProps {
  studentId: string
  activityId: string
  activityMaxScore: number
  grade: number | undefined
  onGradeChange: (studentId: string, activityId: string, score: number) => void
  inputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>
  students: Student[]
}

function GradeInput({
  studentId,
  activityId,
  activityMaxScore,
  grade,
  onGradeChange,
  inputRefs,
  students,
}: GradeInputProps) {
  const inputKey = `${studentId}-${activityId}`
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState<string>(
    grade !== undefined && grade !== null ? grade.toString() : ''
  )

  // Register this input in the parent refs map
  useEffect(() => {
    const el = inputRef.current
    if (el) {
      inputRefs.current.set(inputKey, el)
    }
    return () => {
      inputRefs.current.delete(inputKey)
    }
  }, [inputKey, inputRefs])

  const commitValue = (value: string) => {
    const trimmed = value.trim()
    if (trimmed === '') {
      onGradeChange(studentId, activityId, 0)
      setInputValue('')
      return
    }
    const numericValue = parseFloat(trimmed)
    if (
      !isNaN(numericValue) &&
      numericValue >= 0 &&
      numericValue <= activityMaxScore
    ) {
      onGradeChange(studentId, activityId, numericValue)
      setInputValue(numericValue.toString())
    } else {
      // Revert to saved value or empty
      const savedValue =
        grade !== undefined && grade !== null ? grade.toString() : ''
      setInputValue(savedValue)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    console.log('GradeInput handleChange:', { newValue, studentId, activityId })

    // Allow: empty, digits, digits with one decimal point
    // Examples: "", "9", "9.", "9.5", "0.5", ".5"
    const isValid = newValue === '' || /^\d*\.?\d{0,2}$/.test(newValue)
    console.log('Is valid:', isValid)

    if (isValid) {
      setInputValue(newValue)
    }
  }

  const handleBlur = () => {
    commitValue(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      // Commit current value
      commitValue(inputValue)

      // Find current student index
      const currentStudentIndex = students.findIndex((s) => s.id === studentId)
      if (currentStudentIndex === -1) return

      // Find next student (same column, next row)
      const nextStudentIndex =
        currentStudentIndex + 1 < students.length ? currentStudentIndex + 1 : 0
      const nextStudent = students[nextStudentIndex]

      if (nextStudent) {
        const nextKey = `${nextStudent.id}-${activityId}`
        const nextInput = inputRefs.current.get(nextKey)
        if (nextInput) {
          nextInput.focus()
          // Select all text in the next input
          nextInput.select()
        }
      }
    }
  }

  return (
    <Input
      ref={inputRef}
      type='text'
      inputMode='decimal'
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder='0'
      className='w-20 text-center'
    />
  )
}

export function GradebookPage({
  subjectId,
  gradeId,
  subjectName,
  gradeName,
}: GradebookPageProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>(
    {}
  )
  const [saving, setSaving] = useState(false)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [newActivity, setNewActivity] = useState({
    name: '',
    category: 'apuntes_tareas' as Activity['category'],
    max_score: 100,
    description: '',
  })

  // Refs for grade inputs to handle keyboard navigation
  const gradeInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  useEffect(() => {
    loadGradebookData()
  }, [subjectId, gradeId])

  const loadGradebookData = async () => {
    try {
      setLoading(true)
      const data = await getGradebookData(subjectId, gradeId)
      setStudents(data.students)
      setActivities(data.activities)
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
      await loadGradebookData()
    } catch (error) {
      console.error('Error saving grades:', error)
      toast.error('Error al guardar las calificaciones')
    } finally {
      setSaving(false)
    }
  }

  const calculateStudentAverage = (studentId: string): number => {
    const studentGrades = grades[studentId] || {}
    const activityScores = Object.entries(studentGrades).map(
      ([activityId, score]) => {
        const activity = activities.find((a) => a.id === activityId)
        return activity ? (score / activity.max_score) * 100 : 0
      }
    )

    if (activityScores.length === 0) return 0
    return (
      activityScores.reduce((sum, score) => sum + score, 0) /
      activityScores.length
    )
  }

  const getActivitiesByCategory = (category: Activity['category']) => {
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
      <ProtectedRoute>
        <Header>
          <Search />
          <div className='ms-auto flex items-center gap-4'>
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main fixed>
          <div className='flex min-h-96 items-center justify-center'>
            <div className='text-center'>
              <BookOpen className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
              <p className='text-muted-foreground'>
                Cargando planilla de calificaciones...
              </p>
            </div>
          </div>
        </Main>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Header>
        <Search />
        <div className='ms-auto flex items-center gap-4'>
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='mb-6 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate({ to: '/planillas' })}
            >
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

          <div className='flex items-center gap-2'>
            <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
              <DialogTrigger asChild>
                <Button variant='outline'>
                  <Plus className='mr-2 h-4 w-4' />
                  Agregar Actividad
                </Button>
              </DialogTrigger>
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
                        setNewActivity((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder='Ej: Tarea 1'
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='category'>Categoría</Label>
                    <Select
                      value={newActivity.category}
                      onValueChange={(value: Activity['category']) =>
                        setNewActivity((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
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
                  <Button
                    variant='outline'
                    onClick={() => setShowAddActivity(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddActivity}>Agregar Actividad</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={handleSaveGrades} disabled={saving}>
              <Save className='mr-2 h-4 w-4' />
              {saving ? 'Guardando...' : 'Guardar Calificaciones'}
            </Button>
          </div>
        </div>

        <div className='space-y-6'>
          {/* Summary Cards */}
          <div className='grid gap-4 md:grid-cols-4'>
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <Users className='h-5 w-5 text-blue-600' />
                  <div>
                    <div className='text-2xl font-bold'>{students.length}</div>
                    <div className='text-sm text-muted-foreground'>
                      Estudiantes
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <BookOpen className='h-5 w-5 text-green-600' />
                  <div>
                    <div className='text-2xl font-bold'>
                      {activities.length}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Actividades
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <Calculator className='h-5 w-5 text-purple-600' />
                  <div>
                    <div className='text-2xl font-bold'>
                      {students.length > 0 && activities.length > 0
                        ? (
                            students.reduce(
                              (sum, student) =>
                                sum + calculateStudentAverage(student.id),
                              0
                            ) / students.length
                          ).toFixed(1)
                        : '0.0'}
                      %
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Promedio General
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <BookOpen className='h-5 w-5 text-orange-600' />
                  <div>
                    <div className='text-2xl font-bold'>
                      {Object.values(grades).reduce(
                        (sum, studentGrades) =>
                          sum +
                          Object.values(studentGrades).filter(
                            (grade) => grade > 0
                          ).length,
                        0
                      )}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Calificaciones Guardadas
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {Object.entries(categoryLabels).map(([category, label]) => {
            const categoryActivities = getActivitiesByCategory(
              category as Activity['category']
            )
            if (categoryActivities.length === 0) return null

            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BookOpen className='h-5 w-5' />
                    {label}
                  </CardTitle>
                  <CardDescription>
                    {categoryActivities.length} actividad(es)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-16'>#</TableHead>
                          <TableHead className='min-w-48'>Estudiante</TableHead>
                          {categoryActivities.map((activity) => (
                            <TableHead
                              key={activity.id}
                              className='min-w-32 text-center'
                            >
                              <div className='flex flex-col items-center gap-1'>
                                <div className='flex items-center gap-2'>
                                  <div className='text-center'>
                                    <div className='font-medium'>
                                      {activity.name}
                                    </div>
                                    <div className='text-xs text-muted-foreground'>
                                      Max: {activity.max_score}
                                    </div>
                                  </div>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                      handleDeleteActivity(activity.id)
                                    }
                                    className='h-6 w-6 p-0 text-destructive hover:text-destructive'
                                  >
                                    <Trash2 className='h-3 w-3' />
                                  </Button>
                                </div>
                              </div>
                            </TableHead>
                          ))}
                          <TableHead className='text-center'>
                            <Calculator className='mx-auto h-4 w-4' />
                            <div className='text-xs'>Promedio</div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student, index) => {
                          const average = calculateStudentAverage(student.id)
                          return (
                            <TableRow key={student.id}>
                              <TableCell className='font-medium'>
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className='font-medium'>
                                    {student.name}
                                  </div>
                                  {student.last_name && (
                                    <div className='text-sm text-muted-foreground'>
                                      {student.last_name}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              {categoryActivities.map((activity) => {
                                const grade = getGradeForEntry(
                                  student.id,
                                  activity.id
                                )
                                return (
                                  <TableCell
                                    key={activity.id}
                                    className='text-center'
                                  >
                                    <GradeInput
                                      studentId={student.id}
                                      activityId={activity.id}
                                      activityMaxScore={activity.max_score}
                                      grade={grade}
                                      onGradeChange={handleGradeChange}
                                      inputRefs={gradeInputRefs}
                                      students={students}
                                    />
                                  </TableCell>
                                )
                              })}
                              <TableCell className='text-center font-medium'>
                                {average.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {activities.length === 0 && (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-12'>
                <BookOpen className='mb-4 h-12 w-12 text-muted-foreground' />
                <h3 className='mb-2 text-lg font-semibold'>Sin Actividades</h3>
                <p className='mb-4 text-center text-muted-foreground'>
                  No hay actividades configuradas para esta materia y grado.
                </p>
                <Button onClick={() => setShowAddActivity(true)}>
                  <Plus className='mr-2 h-4 w-4' />
                  Agregar Primera Actividad
                </Button>
              </CardContent>
            </Card>
          )}

          {students.length === 0 && activities.length > 0 && (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-12'>
                <Users className='mb-4 h-12 w-12 text-muted-foreground' />
                <h3 className='mb-2 text-lg font-semibold'>Sin Estudiantes</h3>
                <p className='text-center text-muted-foreground'>
                  No hay estudiantes inscritos en este grado.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </Main>
    </ProtectedRoute>
  )
}

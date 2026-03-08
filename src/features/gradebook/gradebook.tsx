import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/use-auth'
import { getGradebookData, createActivity, upsertGradebookEntry, deleteActivity, Activity, Student } from '@/services/gradebook'
import { ArrowLeft, Plus, Save, Trash2, Users, BookOpen, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'

interface GradebookProps {
  subjectId: string
  gradeId: string
  subjectName: string
  gradeName: string
}

const categoryLabels = {
  apuntes_tareas: 'Apuntes y Tareas',
  talleres_exposiciones: 'Talleres y Exposiciones',
  actitudinal: 'Actitudinal',
  evaluacion: 'Evaluación'
}

export function Gradebook({ subjectId, gradeId, subjectName, gradeName }: GradebookProps) {
  console.log('Gradebook props:', { subjectId, gradeId, subjectName, gradeName })
  
  const [students, setStudents] = useState<Student[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [newActivity, setNewActivity] = useState({
    name: '',
    category: 'apuntes_tareas' as Activity['category'],
    max_score: 100,
    description: ''
  })
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>({})
  
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadGradebookData()
  }, [subjectId, gradeId])

  const loadGradebookData = async () => {
    try {
      setLoading(true)
      const data = await getGradebookData(subjectId, gradeId)
      setStudents(data.students)
      setActivities(data.activities)

      // Initialize grades state from entries
      const gradesMap: Record<string, Record<string, number>> = {}
      data.entries.forEach(entry => {
        if (entry.score !== undefined) {
          if (!gradesMap[entry.student_id]) {
            gradesMap[entry.student_id] = {}
          }
          gradesMap[entry.student_id][entry.activity_id] = entry.score
        }
      })
      setGrades(gradesMap)
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
        teacher_id: user!.id
      })

      setActivities([...activities, activity])
      setNewActivity({
        name: '',
        category: 'apuntes_tareas',
        max_score: 100,
        description: ''
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
      setActivities(activities.filter(a => a.id !== activityId))
      
      // Remove grades for this activity
      const updatedGrades = { ...grades }
      Object.keys(updatedGrades).forEach(studentId => {
        delete updatedGrades[studentId][activityId]
      })
      setGrades(updatedGrades)
      
      toast.success('Actividad eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting activity:', error)
      toast.error('Error al eliminar la actividad')
    }
  }

  const handleGradeChange = (studentId: string, activityId: string, score: number) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [activityId]: score
      }
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
              graded_by: user!.id
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

  const calculateStudentAverage = (studentId: string): number => {
    const studentGrades = grades[studentId] || {}
    const activityScores = Object.entries(studentGrades).map(([activityId, score]) => {
      const activity = activities.find(a => a.id === activityId)
      return activity ? (score / activity.max_score) * 100 : 0
    })
    
    if (activityScores.length === 0) return 0
    return activityScores.reduce((sum, score) => sum + score, 0) / activityScores.length
  }

  const getActivitiesByCategory = (category: Activity['category']) => {
    return activities.filter(activity => activity.category === category)
  }

  const getGradeForEntry = (studentId: string, activityId: string): number | undefined => {
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
          <div className='flex items-center justify-center min-h-96'>
            <div className='text-center'>
              <BookOpen className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <p className='text-muted-foreground'>Cargando planilla de calificaciones...</p>
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
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate({ to: '/planillas' })}
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
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
                  <Plus className='h-4 w-4 mr-2' />
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
                      onChange={(e) => setNewActivity(prev => ({ ...prev, name: e.target.value }))}
                      placeholder='Ej: Tarea 1'
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='category'>Categoría</Label>
                    <Select
                      value={newActivity.category}
                      onValueChange={(value: Activity['category']) => 
                        setNewActivity(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
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
                      onChange={(e) => setNewActivity(prev => ({ 
                        ...prev, 
                        max_score: parseFloat(e.target.value) || 0 
                      }))}
                      min='0'
                      step='0.01'
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='description'>Descripción (Opcional)</Label>
                    <Textarea
                      id='description'
                      value={newActivity.description}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                      placeholder='Descripción de la actividad...'
                    />
                  </div>
                </div>
                <div className='flex justify-end gap-2'>
                  <Button variant='outline' onClick={() => setShowAddActivity(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddActivity}>
                    Agregar Actividad
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button onClick={handleSaveGrades} disabled={saving}>
              <Save className='h-4 w-4 mr-2' />
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
                    <div className='text-sm text-muted-foreground'>Estudiantes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <BookOpen className='h-5 w-5 text-green-600' />
                  <div>
                    <div className='text-2xl font-bold'>{activities.length}</div>
                    <div className='text-sm text-muted-foreground'>Actividades</div>
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
                        ? (students.reduce((sum, student) => sum + calculateStudentAverage(student.id), 0) / students.length).toFixed(1)
                        : '0.0'}%
                    </div>
                    <div className='text-sm text-muted-foreground'>Promedio General</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <Save className='h-5 w-5 text-orange-600' />
                  <div>
                    <div className='text-2xl font-bold'>
                      {Object.values(grades).reduce((sum, studentGrades) => 
                        sum + Object.values(studentGrades).filter(grade => grade > 0).length, 0
                      )}
                    </div>
                    <div className='text-sm text-muted-foreground'>Calificaciones Guardadas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {Object.entries(categoryLabels).map(([category, label]) => {
            const categoryActivities = getActivitiesByCategory(category as Activity['category'])
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
                          {categoryActivities.map(activity => (
                            <TableHead key={activity.id} className='min-w-32 text-center'>
                              <div className='flex flex-col items-center gap-1'>
                                <div className='flex items-center gap-2'>
                                  <div className='text-center'>
                                    <div className='font-medium'>{activity.name}</div>
                                    <div className='text-xs text-muted-foreground'>
                                      Max: {activity.max_score}
                                    </div>
                                  </div>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleDeleteActivity(activity.id)}
                                    className='h-6 w-6 p-0 text-destructive hover:text-destructive'
                                  >
                                    <Trash2 className='h-3 w-3' />
                                  </Button>
                                </div>
                              </div>
                            </TableHead>
                          ))}
                          <TableHead className='text-center'>
                            <Calculator className='h-4 w-4 mx-auto' />
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
                                  <div className='font-medium'>{student.name}</div>
                                  {student.last_name && (
                                    <div className='text-sm text-muted-foreground'>
                                      {student.last_name}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              {categoryActivities.map(activity => {
                                const grade = getGradeForEntry(student.id, activity.id)
                                return (
                                  <TableCell key={activity.id} className='text-center'>
                                    <Input
                                      type='number'
                                      value={grade || ''}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value)
                                        if (!isNaN(value) && value >= 0 && value <= activity.max_score) {
                                          handleGradeChange(student.id, activity.id, value)
                                        } else if (e.target.value === '') {
                                          handleGradeChange(student.id, activity.id, 0)
                                        }
                                      }}
                                      placeholder='0'
                                      min='0'
                                      max={activity.max_score}
                                      step='0.01'
                                      className='w-20 text-center'
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
                <BookOpen className='h-12 w-12 text-muted-foreground mb-4' />
                <h3 className='text-lg font-semibold mb-2'>Sin Actividades</h3>
                <p className='text-muted-foreground text-center mb-4'>
                  No hay actividades configuradas para esta materia y grado.
                </p>
                <Button onClick={() => setShowAddActivity(true)}>
                  <Plus className='h-4 w-4 mr-2' />
                  Agregar Primera Actividad
                </Button>
              </CardContent>
            </Card>
          )}

          {students.length === 0 && activities.length > 0 && (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-12'>
                <Users className='h-12 w-12 text-muted-foreground mb-4' />
                <h3 className='text-lg font-semibold mb-2'>Sin Estudiantes</h3>
                <p className='text-muted-foreground text-center'>
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

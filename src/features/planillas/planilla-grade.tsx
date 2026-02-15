import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useParams } from '@tanstack/react-router'
import { getAssignmentsByTeacher, Assignment } from '@/services/assignments'
import { sortGradesEducationally } from '@/utils/grade-ordering'
import { 
  Users, 
  BookOpen, 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface Student {
  id: string
  name: string
  attendance: number
  attitude: number
  evaluation: number
  finalGrade: number
}

interface Activity {
  id: string
  type: 'apuntes-tareas' | 'talleres-exposiciones'
  title: string
  description: string
  grade: number
  completed: boolean
}

export function PlanillaGrade() {
  const { gradeId } = useParams({ from: '/planillas/$gradeId' })
  const { user, isDocente } = useAuth()
  
  const [students, setStudents] = useState<Student[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('apuntes-tareas')
  const [newActivity, setNewActivity] = useState({ title: '', description: '', type: 'apuntes-tareas' })
  const [editingStudent, setEditingStudent] = useState<string | null>(null)

  useEffect(() => {
    if (user && isDocente && gradeId) {
      loadPlanillaData()
    }
  }, [user, isDocente, gradeId])

  const loadPlanillaData = async () => {
    try {
      setLoading(true)
      
      // Simular carga de datos - en producción esto vendría de la API
      const mockStudents: Student[] = [
        { id: '1', name: 'Ana María García López', attendance: 95, attitude: 85, evaluation: 88, finalGrade: 87 },
        { id: '2', name: 'Carlos Andrés Martínez Rodríguez', attendance: 92, attitude: 90, evaluation: 85, finalGrade: 86 },
        { id: '3', name: 'Diana Sofía Hernández Castillo', attendance: 98, attitude: 92, evaluation: 94, finalGrade: 95 },
        { id: '4', name: 'Luis Alberto Ramírez Torres', attendance: 88, attitude: 87, evaluation: 82, finalGrade: 82 },
        { id: '5', name: 'María Fernanda Díaz Castro', attendance: 96, attitude: 89, evaluation: 91, finalGrade: 92 },
      ]

      const mockActivities: Activity[] = [
        { id: '1', type: 'apuntes-tareas', title: 'Examen Parcial - Matemáticas', description: 'Evaluación de operaciones básicas', grade: 85, completed: true },
        { id: '2', type: 'apuntes-tareas', title: 'Tarea - Problemas Algebraicos', description: 'Resolver 10 problemas del capítulo 3', grade: 90, completed: true },
        { id: '3', type: 'talleres-exposiciones', title: 'Taller - Geometría Práctica', description: 'Construcción de figuras geométricas', grade: 88, completed: true },
        { id: '4', type: 'talleres-exposiciones', title: 'Exposición - Teoremas Matemáticos', description: 'Presentación del teorema de Pitágoras', grade: 92, completed: false },
      ]

      setStudents(mockStudents)
      setActivities(mockActivities)
    } catch (error) {
      console.error('Error loading planilla:', error)
      toast.error('Error al cargar la planilla')
    } finally {
      setLoading(false)
    }
  }

  const handleAddActivity = () => {
    if (!newActivity.title.trim()) return
    
    const activity: Activity = {
      id: Date.now().toString(),
      ...newActivity,
      grade: 0,
      completed: false
    }
    
    setActivities([...activities, activity])
    setNewActivity({ title: '', description: '', type: activeTab })
    toast.success('Actividad agregada correctamente')
  }

  const handleDeleteActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id))
    toast.success('Actividad eliminada correctamente')
  }

  const handleStudentGradeChange = (studentId: string, field: keyof Student, value: number) => {
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, [field]: value } : s
    ))
  }

  const getGradeInfo = () => {
    const assignment = students.length > 0 ? {
      gradeName: 'Primer Grado',
      subjectName: 'Matemáticas'
    } : null
    
    return assignment
  }

  const getAverage = (field: keyof Student) => {
    const values = students.map(s => s[field]).filter(v => v > 0)
    return values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '0.0'
  }

  // Si no es docente, mostrar mensaje de acceso denegado
  if (!isDocente) {
    return (
      <ProtectedRoute>
        <div className='flex items-center justify-center min-h-screen'>
          <Card className='max-w-md'>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <Users className='h-12 w-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>Acceso Restringido</h3>
              <p className='text-muted-foreground text-center'>
                Esta página está disponible únicamente para docentes.
              </p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Header>
          <Search />
          <div className='ms-auto flex items-center gap-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        </Main>
      </ProtectedRoute>
    )
  }

  const gradeInfo = getGradeInfo()

  return (
    <ProtectedRoute>
      <Header>
        <Search />
        <div className='ms-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        {/* Header con navegación */}
        <div className='flex items-center gap-4 mb-6'>
          <Button variant='outline' size='sm' className='mb-0'>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Volver a Planillas
          </Button>
          
          {gradeInfo && (
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                Planilla - {gradeInfo.gradeName}
              </h1>
              <p className='text-muted-foreground text-lg'>
                {gradeInfo.subjectName}
              </p>
            </div>
          )}
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Lista de Estudiantes */}
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Registro de Calificaciones
              </CardTitle>
              <CardDescription>
                Sistema de evaluación del grupo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {students.map((student) => (
                  <div key={student.id} className='border rounded-lg p-4'>
                    {/* Encabezado del estudiante */}
                    <div className='flex items-center justify-between mb-4'>
                      <div>
                        <h3 className='font-semibold text-lg'>{student.name}</h3>
                        <p className='text-sm text-muted-foreground'>
                          Estudiante ID: {student.id}
                        </p>
                      </div>
                      <div className='flex gap-2'>
                        <Badge variant={student.attendance >= 90 ? 'default' : 'secondary'}>
                          {student.attendance >= 90 ? 'Excelente' : student.attendance >= 80 ? 'Bueno' : 'Regular'}
                        </Badge>
                        <Button size='sm' variant='outline' onClick={() => setEditingStudent(student.id)}>
                          <Edit className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>

                    {/* Sistema de calificación */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {/* Asistencia */}
                      <div className='space-y-2'>
                        <h4 className='font-medium text-sm text-blue-600 flex items-center gap-2'>
                          📅 Asistencia
                          <span className='text-xs bg-blue-100 px-2 py-1 rounded'>
                            {student.attendance}% de presencia
                          </span>
                        </h4>
                        <div className='text-2xl font-bold text-blue-600'>
                          {student.attendance}%
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {student.attendance >= 95 ? 'Asistencia perfecta' : 
                           student.attendance >= 90 ? 'Excelente asistencia' :
                           student.attendance >= 80 ? 'Buena asistencia' :
                           'Asistencia mejorable'}
                        </p>
                        <div className='mt-2 space-y-1'>
                          <div className='text-xs'>
                            <span className='font-medium'>Respeto:</span>
                            <div className='w-full bg-gray-200 rounded-full h-2 mt-1'>
                              <div 
                                className='bg-blue-500 h-2 rounded-full' 
                                style={{width: `${student.attendance}%`}}
                              ></div>
                            </div>
                          </div>
                          <div className='text-xs'>
                            <span className='font-medium'>Participación:</span>
                            <div className='w-full bg-gray-200 rounded-full h-2 mt-1'>
                              <div 
                                className='bg-blue-500 h-2 rounded-full' 
                                style={{width: `${student.attendance * 0.8}%`}}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actitudinal */}
                      <div className='space-y-2'>
                        <h4 className='font-medium text-sm text-green-600 flex items-center gap-2'>
                          😊 Actitudinal
                          <span className='text-xs bg-green-100 px-2 py-1 rounded'>
                            Comportamiento y participación
                          </span>
                        </h4>
                        <div className='text-2xl font-bold text-green-600'>
                          {student.attitude}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {student.attitude >= 95 ? 'Comportamiento ejemplar' :
                           student.attitude >= 90 ? 'Excelente comportamiento' :
                           student.attitude >= 80 ? 'Buen comportamiento' :
                           'Comportamiento mejorable'}
                        </p>
                        <div className='mt-2 space-y-1'>
                          <div className='text-xs'>
                            <span className='font-medium'>Respeto:</span>
                            <div className='w-full bg-gray-200 rounded-full h-2 mt-1'>
                              <div 
                                className='bg-green-500 h-2 rounded-full' 
                                style={{width: `${student.attitude}%`}}
                              ></div>
                            </div>
                          </div>
                          <div className='text-xs'>
                            <span className='font-medium'>Participación:</span>
                            <div className='w-full bg-gray-200 rounded-full h-2 mt-1'>
                              <div 
                                className='bg-blue-500 h-2 rounded-full' 
                                style={{width: `${student.attitude * 0.8}%`}}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Evaluación */}
                      <div className='space-y-2'>
                        <h4 className='font-medium text-sm text-purple-600 flex items-center gap-2'>
                          📝 Evaluación
                          <span className='text-xs bg-purple-100 px-2 py-1 rounded'>
                            Exámenes y trabajos
                          </span>
                        </h4>
                        <div className='text-2xl font-bold text-purple-600'>
                          {student.evaluation}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {student.evaluation >= 95 ? 'Desempeño sobresaliente' :
                           student.evaluation >= 90 ? 'Desempeño excelente' :
                           student.evaluation >= 80 ? 'Buen desempeño' :
                           'Desempeño mejorable'}
                        </p>
                        <div className='mt-2 space-y-1'>
                          <div className='text-xs'>
                            <span className='font-medium'>Exámenes:</span>
                            <div className='w-full bg-gray-200 rounded-full h-2 mt-1'>
                              <div 
                                className='bg-purple-500 h-2 rounded-full' 
                                style={{width: `${student.evaluation * 0.6}%`}}
                              ></div>
                            </div>
                          </div>
                          <div className='text-xs'>
                            <span className='font-medium'>Trabajos:</span>
                            <div className='w-full bg-gray-200 rounded-full h-2 mt-1'>
                              <div 
                                className='bg-indigo-500 h-2 rounded-full' 
                                style={{width: `${student.evaluation * 0.4}%`}}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Definitiva */}
                      <div className='space-y-2 md:col-span-2'>
                        <h4 className='font-medium text-sm text-orange-600 flex items-center gap-2'>
                          🏆 Definitiva
                          <span className='text-xs bg-orange-100 px-2 py-1 rounded'>
                            Nota final del período
                          </span>
                        </h4>
                        <div className='text-2xl font-bold text-orange-600'>
                          {student.finalGrade}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {student.finalGrade >= 95 ? 'Calificación sobresaliente' :
                           student.finalGrade >= 90 ? 'Calificación excelente' :
                           student.finalGrade >= 80 ? 'Buena calificación' :
                           student.finalGrade >= 70 ? 'Calificación aprobatoria' :
                           'Calificación reprobatoria'}
                        </p>
                        <div className='mt-2'>
                          <div className='text-xs font-medium mb-1'>Escala de calificación:</div>
                          <div className='flex justify-between text-xs bg-gray-100 rounded p-2'>
                            <span>60-69</span>
                            <span>Reprobatorio</span>
                            <span>70-79</span>
                            <span>Aprobatorio</span>
                            <span>80-89</span>
                            <span>Bueno</span>
                            <span>90-100</span>
                            <span>Excelente</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción en modo edición */}
                    {editingStudent === student.id && (
                      <div className='mt-4 pt-4 border-t flex gap-2'>
                        <Button size='sm' onClick={() => setEditingStudent(null)}>
                          <CheckCircle className='h-4 w-4 mr-2' />
                          Guardar Cambios
                        </Button>
                        <Button size='sm' variant='outline' onClick={() => setEditingStudent(null)}>
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Resumen general mejorado */}
                <div className='mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border'>
                  <h4 className='font-semibold mb-4 text-center'>📊 Resumen General del Grupo</h4>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-blue-600'>{getAverage('attendance')}%</div>
                      <div className='text-xs text-muted-foreground'>Asistencia<br/>Promedio</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>{getAverage('attitude')}</div>
                      <div className='text-xs text-muted-foreground'>Actitudinal<br/>Promedio</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-purple-600'>{getAverage('evaluation')}</div>
                      <div className='text-xs text-muted-foreground'>Evaluación<br/>Promedio</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-orange-600'>{getAverage('finalGrade')}</div>
                      <div className='text-xs text-muted-foreground'>Definitiva<br/>Promedio</div>
                    </div>
                    <div className='text-center md:col-span-2'>
                      <div className='text-lg font-bold text-gray-600'>{students.length}</div>
                      <div className='text-xs text-muted-foreground'>Total<br/>Estudiantes</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actividades */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BookOpen className='h-5 w-5' />
                Actividades
              </CardTitle>
              <CardDescription>
                Gestiona actividades y evaluaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='apuntes-tareas'>Apuntes y Tareas</TabsTrigger>
                  <TabsTrigger value='talleres-exposiciones'>Talleres y Exposiciones</TabsTrigger>
                </TabsList>

                <TabsContent value='apuntes-tareas' className='mt-4'>
                  <div className='space-y-4'>
                    {/* Agregar nueva actividad */}
                    <div className='flex gap-2 mb-4'>
                      <Input
                        placeholder='Título de la actividad'
                        value={newActivity.title}
                        onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                        className='flex-1'
                      />
                      <Button onClick={handleAddActivity}>
                        <Plus className='h-4 w-4 mr-2' />
                        Agregar
                      </Button>
                    </div>

                    {/* Lista de actividades */}
                    <div className='space-y-2'>
                      {activities
                        .filter(a => a.type === 'apuntes-tareas')
                        .map((activity) => (
                          <div key={activity.id} className='flex items-center justify-between p-3 border rounded-lg'>
                            <div className='flex-1'>
                              <p className='font-medium'>{activity.title}</p>
                              <p className='text-sm text-muted-foreground'>{activity.description}</p>
                              {activity.completed && (
                                <Badge variant='default' className='mt-1'>Completado</Badge>
                              )}
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='text-sm font-medium'>{activity.grade}</span>
                              <Button size='sm' variant='outline' onClick={() => handleDeleteActivity(activity.id)}>
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='talleres-exposiciones' className='mt-4'>
                  <div className='space-y-4'>
                    {/* Agregar nueva actividad */}
                    <div className='flex gap-2 mb-4'>
                      <Input
                        placeholder='Título de la actividad'
                        value={newActivity.title}
                        onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                        className='flex-1'
                      />
                      <Button onClick={handleAddActivity}>
                        <Plus className='h-4 w-4 mr-2' />
                        Agregar
                      </Button>
                    </div>

                    {/* Lista de actividades */}
                    <div className='space-y-2'>
                      {activities
                        .filter(a => a.type === 'talleres-exposiciones')
                        .map((activity) => (
                          <div key={activity.id} className='flex items-center justify-between p-3 border rounded-lg'>
                            <div className='flex-1'>
                              <p className='font-medium'>{activity.title}</p>
                              <p className='text-sm text-muted-foreground'>{activity.description}</p>
                              {activity.completed && (
                                <Badge variant='default' className='mt-1'>Completado</Badge>
                              )}
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='text-sm font-medium'>{activity.grade}</span>
                              <Button size='sm' variant='outline' onClick={() => handleDeleteActivity(activity.id)}>
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </Main>
    </ProtectedRoute>
  )
}

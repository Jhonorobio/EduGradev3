import { useEffect, useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Plus, Trash2, Edit, MoreVertical, Save } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useStudentAverages } from '@/hooks/use-student-averages'
import { getGradebookData, createActivity, upsertGradebookEntry, deleteActivity, getGradebookSettings } from '@/services/gradebook'
import { getColegioSettings } from '@/services/colegio-settings'
import { toast } from 'sonner'

interface GradebookTableProps {
  subjectId: string
  gradeId: string
  subjectName: string
  gradeName: string
  collegeId?: string
  onBack: () => void
}

export function GradebookTable({ subjectId, gradeId, subjectName, gradeName, collegeId, onBack }: GradebookTableProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>({})
  const [colegioSettings, setColegioSettings] = useState<any>(null)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [editingActivity, setEditingActivity] = useState<any>(null)
  const [deletingActivity, setDeletingActivity] = useState<any>(null)
  const [openMenuActivityId, setOpenMenuActivityId] = useState<string | null>(null)
  const [actitudinalActivityId, setActitudinalActivityId] = useState<string>('')
  const [evaluacionActivityId, setEvaluacionActivityId] = useState<string>('')
  const menuRef = useRef<HTMLDivElement>(null)
  const [newActivity, setNewActivity] = useState({
    name: '',
    category: '',
    type: ''
  })

  // Obtener el maxScore según la configuración del colegio (escala global)
  const getEffectiveMaxScore = () => {
    return colegioSettings?.escala_calificacion === '1-5' ? 5 : 10
  }

  // Use student averages hook
  const { getAverage, getClassAverage, getGradedCount } = useStudentAverages(students, activities, grades)

  // Calculate category averages
  const getCategoryAverage = (studentId: string, category: string) => {
    const categoryActivities = activities.filter(a => a.category === category)
    if (categoryActivities.length === 0) return 0
    
    let total = 0
    let count = 0
    categoryActivities.forEach(activity => {
      const grade = grades[studentId]?.[activity.id]
      if (grade && grade > 0) {
        total += grade
        count++
      }
    })
    
    if (count === 0) return 0
    return (total / count) * 10 // Convert to percentage (assuming 1-10 scale)
  }

  // Group activities by category
  const activitiesByCategory = {
    apuntes_tareas: activities.filter(a => a.category === 'apuntes_tareas'),
    talleres_exposiciones: activities.filter(a => a.category === 'talleres_exposiciones'),
    actitudinal: activities.filter(a => a.category === 'actitudinal'),
    evaluacion: activities.filter(a => a.category === 'evaluacion'),
  }

  // Calculate total columns: # + Estudiante + filtered activities + Actitudinal + Evaluacion + Nota Final
  const filteredActivities = activities.filter(a => a.category !== 'actitudinal' && a.category !== 'evaluacion')
  const totalColumns = filteredActivities.length + 2 + 2 + 1
  
  // Calcular ancho máximo adaptativo según cantidad de actividades
  const getActivityNameMaxWidth = () => {
    const count = filteredActivities.length
    if (count <= 2) return 'max-w-[300px]'
    if (count <= 4) return 'max-w-[220px]'
    if (count <= 6) return 'max-w-[120px]'
    return 'max-w-[80px]'
  }
  const activityNameMaxWidth = getActivityNameMaxWidth()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuActivityId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    loadGradebookData()
  }, [subjectId, gradeId])

  const loadGradebookData = async () => {
    try {
      setLoading(true)

      // Primero cargar configuración del colegio
      let settings = null
      if (collegeId) {
        settings = await getColegioSettings(collegeId)
        setColegioSettings(settings)
      }
      
      const maxScore = settings?.escala_calificacion === '1-5' ? 5 : 10

      // Cargar datos del gradebook
      const data = await getGradebookData(subjectId, gradeId)
      setStudents(data.students || [])
      
      let activitiesList = data.activities || []
      
      // Filtrar para usar solo la primera actividad de cada categoría fija (evitar duplicados)
      const seenFixedCategories = new Set()
      activitiesList = activitiesList.filter((a: any) => {
        if (a.category === 'actitudinal' || a.category === 'evaluacion') {
          if (seenFixedCategories.has(a.category)) {
            return false // Skip duplicate
          }
          seenFixedCategories.add(a.category)
        }
        return true
      })
      
      // Buscar si ya existen las actividades fijas de Actitudinal y Evaluación
      let actitudinalActivity = activitiesList.find((a: any) => a.category === 'actitudinal')
      let evaluacionActivity = activitiesList.find((a: any) => a.category === 'evaluacion')
      
      // Si no existen, crearlas en la base de datos con la escala correcta
      if (!actitudinalActivity && user?.id) {
        try {
          actitudinalActivity = await createActivity({
            name: 'Actitudinal',
            subject_id: subjectId,
            grade_id: gradeId,
            category: 'actitudinal',
            max_score: maxScore,
            teacher_id: user.id,
            description: 'Nota de comportamiento y actitud'
          })
        } catch (e) {
          console.error('Error creating actitudinal activity:', e)
        }
      }
      
      if (!evaluacionActivity && user?.id) {
        try {
          evaluacionActivity = await createActivity({
            name: 'Evaluación',
            subject_id: subjectId,
            grade_id: gradeId,
            category: 'evaluacion',
            max_score: maxScore,
            teacher_id: user.id,
            description: 'Nota de evaluación'
          })
        } catch (e) {
          console.error('Error creating evaluacion activity:', e)
        }
      }
      
      // Agregar al listado si fueron creadas
      if (actitudinalActivity && !activitiesList.find((a: any) => a.id === actitudinalActivity.id)) {
        activitiesList = [...activitiesList, actitudinalActivity]
      }
      if (evaluacionActivity && !activitiesList.find((a: any) => a.id === evaluacionActivity.id)) {
        activitiesList = [...activitiesList, evaluacionActivity]
      }
      
      // Guardar los IDs de las actividades fijas
      const actitudinal = activitiesList.find((a: any) => a.category === 'actitudinal')
      const evaluacion = activitiesList.find((a: any) => a.category === 'evaluacion')
      if (actitudinal) setActitudinalActivityId(actitudinal.id)
      if (evaluacion) setEvaluacionActivityId(evaluacion.id)
      
      setActivities(activitiesList)
      setGrades(data.grades || {})
    } catch (error) {
      console.error('Error loading gradebook data:', error)
      toast.error('Error al cargar los datos de la planilla')
    } finally {
      setLoading(false)
    }
  }
       
  const handleGradeChange = (studentId: string, activityId: string, value: number) => {
    const newGrades = { ...grades }
    if (!newGrades[studentId]) {
      newGrades[studentId] = {}
    }
    newGrades[studentId][activityId] = value
    setGrades(newGrades)

    // Save to backend
    upsertGradebookEntry({
      student_id: studentId,
      activity_id: activityId,
      score: value,
      graded_by: user?.id
    }).catch(error => {
      console.error('Error saving grade:', error)
      toast.error('Error al guardar la calificación')
    })
  }

  const handleAddActivity = async () => {
    if (!newActivity.name || !newActivity.category) {
      toast.error('Debe ingresar el nombre y seleccionar el tipo')
      return
    }

    try {
      // Usar la escala de calificación del colegio
      const maxScore = getEffectiveMaxScore()

      // Determinar la categoría basada en el tipo seleccionado
      const apuntesTypes = colegioSettings?.activity_types?.apuntes_tareas || []
      const talleresTypes = colegioSettings?.activity_types?.talleres_exposiciones || []
      
      let category = 'apuntes_tareas' // por defecto
      // newActivity.type contiene el tipo seleccionado (ej: "Taller práctico", "Tarea", etc.)
      if (talleresTypes.includes(newActivity.type)) {
        category = 'talleres_exposiciones'
      }

      const activity = await createActivity({
        name: newActivity.name,
        subject_id: subjectId,
        grade_id: gradeId,
        category: category as any,
        max_score: maxScore,
        teacher_id: user?.id || '',
        description: newActivity.type // Guardar el tipo en la descripción
      })

      setActivities([...activities, activity])
      setShowAddActivity(false)
      setNewActivity({
        name: '',
        category: '',
        type: ''
      })
      toast.success('Actividad agregada exitosamente')
    } catch (error) {
      console.error('Error adding activity:', error)
      toast.error('Error al agregar la actividad')
    }
  }

  const handleDeleteActivity = (activity: any) => {
    setDeletingActivity(activity)
    setOpenMenuActivityId(null)
  }

  const confirmDeleteActivity = async () => {
    try {
      await deleteActivity(deletingActivity.id)
      setActivities(activities.filter(a => a.id !== deletingActivity.id))
      setDeletingActivity(null)
      toast.success('Actividad eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting activity:', error)
      toast.error('Error al eliminar la actividad')
    }
  }

  const handleEditActivity = (activity: any) => {
    setEditingActivity(activity)
    setOpenMenuActivityId(null)
  }

  const getGradeForEntry = (studentId: string, activityId: string) => {
    return grades[studentId]?.[activityId] || 0
  }

  return (
    <div className='space-y-4'>
      {/* Header with actions */}
      <div className='flex items-center justify-between'>
        <Button variant='outline' onClick={onBack}>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Volver
        </Button>
        
        <div className='text-center'>
          <h2 className='text-2xl font-bold'>{subjectName}</h2>
          <p className='text-muted-foreground'>{gradeName}</p>
        </div>

        <div className='flex gap-2'>
          <Button onClick={async () => {
            // Guardar todas las calificaciones pendientes
            let savedCount = 0
            for (const [studentId, activities] of Object.entries(grades)) {
              for (const [activityId, score] of Object.entries(activities as any)) {
                if (score > 0) {
                  try {
                    await upsertGradebookEntry({
                      student_id: studentId,
                      activity_id: activityId,
                      score: score,
                      graded_by: user?.id
                    })
                    savedCount++
                  } catch (error) {
                    console.error('Error guardando:', error)
                  }
                }
              }
            }
            toast.success(`Calificaciones guardadas (${savedCount})`)
          }}>
            <Save className='h-4 w-4 mr-2' />
            Guardar
          </Button>
          <Button onClick={() => setShowAddActivity(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Agregar Actividad
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[40px] bg-gray-100 rounded-tl-lg border-r text-center'>#</TableHead>
              <TableHead className='bg-gray-100 border-r'>Estudiante</TableHead>
          {activities.filter(a => a.category !== 'actitudinal' && a.category !== 'evaluacion').map((activity) => {
            // Formatear la fecha: Mes Día (ej: Feb 3)
            const fecha = activity.created_at 
              ? (() => {
                  const date = new Date(activity.created_at)
                  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                  const mes = meses[date.getMonth()]
                  const dia = date.getDate()
                  return `${mes} ${dia}`
                })()
              : ''
            
            // El tipo está en la descripción
            const tipo = activity.description || ''
            
            return (
              <TableHead
                key={activity.id}
                className='text-left relative bg-gray-100 border-r'
              >
                <div className='relative pr-1 py-2'>
                  <div className='text-xs text-muted-foreground mb-0.5'>{fecha}</div>
                  <div
                    className={`text-sm leading-none truncate pb-0.5 ${activityNameMaxWidth}`}
                    title={activity.name}
                  >
                    {activity.name}
                  </div>
                  <div className='text-xs text-gray-500 mt-0.5'>{tipo}</div>
                  <button
                    onClick={() => setOpenMenuActivityId(openMenuActivityId === activity.id ? null : activity.id)}
                    className='absolute top-1 -right-2 p-0.5 hover:bg-gray-200 rounded'
                  >
                    <MoreVertical className='h-4 w-4' />
                  </button>
                    {openMenuActivityId === activity.id && (
                      <div ref={menuRef} className='absolute top-6 right-0 bg-white border rounded shadow-lg z-10 min-w-[120px]'>
                        <button
                          onClick={() => handleEditActivity(activity)}
                          className='w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2'
                        >
                          <Edit className='h-3 w-3' />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity)}
                          className='w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-500 flex items-center gap-2'
                        >
                          <Trash2 className='h-3 w-3' />
                          Eliminar
                        </button>
                      </div>
                    )}
              </div>
              </TableHead>
            )
          })}
              <TableHead className='text-center bg-gray-100 border-r w-[100px]'>
                {actitudinalActivityId ? 'Actitudinal' : '-'}
              </TableHead>
              <TableHead className='text-center bg-gray-100 border-r w-[100px]'>
                {evaluacionActivityId ? 'Evaluación' : '-'}
              </TableHead>
              <TableHead className='text-center bg-gray-100 rounded-tr-lg w-[100px]'>Nota Final</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={totalColumns} className='h-24 text-center'>
                  Cargando datos...
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalColumns} className='h-24 text-center'>
                  No hay estudiantes en este grado
                </TableCell>
              </TableRow>
            ) : (
              students.map((student: any, index: number) => (
                <TableRow key={student.id}>
                  <TableCell className='text-center font-medium border-r'>{index + 1}</TableCell>
                  <TableCell className='border-r'>
                    <div>
                      <div className='font-medium'>{student.name}</div>
                      {student.last_name && (
                        <div className='text-sm text-muted-foreground'>
                          {student.last_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {activities.filter(a => a.category !== 'actitudinal' && a.category !== 'evaluacion').map((activity) => {
                    const grade = getGradeForEntry(student.id, activity.id)
                    return (
                      <TableCell key={`${student.id}-${activity.id}`} className='border-r'>
                        {(() => {
                          const effectiveMax = getEffectiveMaxScore()
                          return (
                            <Input
                              type='text'
                              inputMode='decimal'
                              value={grade || ''}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value)
                                if (!isNaN(value) && value >= 0 && value <= effectiveMax) {
                                  handleGradeChange(student.id, activity.id, value)
                                } else if (e.target.value === '') {
                                  handleGradeChange(student.id, activity.id, 0)
                                }
                              }}
                              placeholder='-'
                              min='0'
                              max={effectiveMax}
                              step={colegioSettings?.escala_calificacion === '1-5' ? '0.1' : '0.01'}
                              className='w-full h-8 text-center text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
                            />
                          )
                        })()}
                      </TableCell>
                    )
                  })}
                  <TableCell className='text-center border-r'>
                    {actitudinalActivityId ? (
                        <Input
                          type='text'
                          inputMode='decimal'
                          value={grades[student.id]?.[actitudinalActivityId] || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            const maxVal = colegioSettings?.escala_calificacion === '1-5' ? 5 : 10
                            if (!isNaN(value) && value >= 0 && value <= maxVal) {
                              handleGradeChange(student.id, actitudinalActivityId, value)
                            } else if (e.target.value === '') {
                              handleGradeChange(student.id, actitudinalActivityId, 0)
                            }
                          }}
                          placeholder='-'
                          min='0'
                          max={colegioSettings?.escala_calificacion === '1-5' ? 5 : 10}
                          step={colegioSettings?.escala_calificacion === '1-5' ? '0.1' : '0.01'}
                          className='w-full h-8 text-center text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
                        />
                    ) : '-'}
                  </TableCell>
                  <TableCell className='text-center border-r'>
                    {evaluacionActivityId ? (
                      <Input
                        type='text'
                        inputMode='decimal'
                        value={grades[student.id]?.[evaluacionActivityId] || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          const maxVal = colegioSettings?.escala_calificacion === '1-5' ? 5 : 10
                          if (!isNaN(value) && value >= 0 && value <= maxVal) {
                            handleGradeChange(student.id, evaluacionActivityId, value)
                          } else if (e.target.value === '') {
                            handleGradeChange(student.id, evaluacionActivityId, 0)
                          }
                        }}
                        placeholder='-'
                        min='0'
                        max={colegioSettings?.escala_calificacion === '1-5' ? 5 : 10}
                        step={colegioSettings?.escala_calificacion === '1-5' ? '0.1' : '0.01'}
                        className='w-full h-8 text-center text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell className='text-center font-medium'>
                    {getAverage(student.id).toFixed(1)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Activity Dialog */}
      {showAddActivity && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 max-w-full mx-4'>
            <h3 className='text-lg font-semibold mb-4'>Agregar Nueva Actividad</h3>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>Nombre</label>
                <Input
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  placeholder='Nombre de la actividad'
                />
              </div>
                <div>
                  <label className='text-sm font-medium'>Tipo</label>
                  <Select
                    value={newActivity.type}
                    onValueChange={(value) => {
                      // Determinar la categoría basada en el tipo seleccionado
                      const apuntesTypes = colegioSettings?.activity_types?.apuntes_tareas || []
                      const talleresTypes = colegioSettings?.activity_types?.talleres_exposiciones || []

                      let category = 'apuntes_tareas'
                      if (talleresTypes.includes(value)) {
                        category = 'talleres_exposiciones'
                      }

                      setNewActivity({ ...newActivity, category, type: value })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Seleccionar tipo' />
                    </SelectTrigger>
                    <SelectContent>
                      {colegioSettings?.activity_types?.apuntes_tareas?.map((type: string) => (
                        <SelectItem key={`apuntes-${type}`} value={type}>{type}</SelectItem>
                      ))}
                      {colegioSettings?.activity_types?.talleres_exposiciones?.map((type: string) => (
                        <SelectItem key={`talleres-${type}`} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>
            <div className='flex justify-end gap-2 mt-6'>
              <Button variant='outline' onClick={() => setShowAddActivity(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddActivity}>
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Activity Dialog */}
      {editingActivity && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 max-w-full mx-4'>
            <h3 className='text-lg font-semibold mb-4'>Editar Actividad</h3>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>Nombre</label>
                <Input
                  value={editingActivity.name}
                  onChange={(e) => setEditingActivity({ ...editingActivity, name: e.target.value })}
                  placeholder='Nombre de la actividad'
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Tipo</label>
                <Select
                  value={editingActivity.description || editingActivity.category}
                  onValueChange={(value) => {
                    // Determinar la categoría basada en el tipo seleccionado
                    const apuntesTypes = colegioSettings?.activity_types?.apuntes_tareas || []
                    const talleresTypes = colegioSettings?.activity_types?.talleres_exposiciones || []
                    
                    let category = 'apuntes_tareas'
                    if (talleresTypes.includes(value)) {
                      category = 'talleres_exposiciones'
                    }
                    
                    setEditingActivity({ ...editingActivity, category, description: value })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Seleccionar tipo' />
                  </SelectTrigger>
                  <SelectContent>
                    {colegioSettings?.activity_types?.apuntes_tareas?.map((type: string) => (
                      <SelectItem key={`apuntes-${type}`} value={type}>{type}</SelectItem>
                    ))}
                    {colegioSettings?.activity_types?.talleres_exposiciones?.map((type: string) => (
                      <SelectItem key={`talleres-${type}`} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='flex justify-end gap-2 mt-6'>
              <Button variant='outline' onClick={() => setEditingActivity(null)}>
                Cancelar
              </Button>
              <Button onClick={async () => {
                try {
                  // Actualizar la actividad en la base de datos
                  const { updateActivity } = await import('@/services/gradebook')
                  await updateActivity(editingActivity.id, {
                    name: editingActivity.name,
                    category: editingActivity.category,
                    description: editingActivity.description
                  })
                  
                  // Actualizar el estado local
                  setActivities(activities.map(a => 
                    a.id === editingActivity.id ? { 
                      ...a, 
                      name: editingActivity.name,
                      category: editingActivity.category,
                      description: editingActivity.description
                    } : a
                  ))
                  setEditingActivity(null)
                  toast.success('Actividad actualizada exitosamente')
                } catch (error) {
                  console.error('Error updating activity:', error)
                  toast.error('Error al actualizar la actividad')
                }
              }}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Activity Confirmation Dialog */}
      {deletingActivity && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 max-w-full mx-4'>
            <h3 className='text-lg font-semibold mb-4'>Eliminar Actividad</h3>
            <p className='text-muted-foreground mb-6'>
              ¿Estás seguro de que deseas eliminar la actividad "{deletingActivity.name}"? 
              Esta acción no se puede deshacer y se eliminarán todas las calificaciones asociadas.
            </p>
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setDeletingActivity(null)}>
                Cancelar
              </Button>
              <Button variant='destructive' onClick={confirmDeleteActivity}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

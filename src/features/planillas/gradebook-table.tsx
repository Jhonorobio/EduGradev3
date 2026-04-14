import { useEffect, useState, useRef } from 'react'
import { getColegioSettings } from '@/services/colegio-settings'
import {
  getGradebookData,
  createActivity,
  upsertGradebookEntry,
  deleteActivity,
} from '@/services/gradebook'
import { ArrowLeft, Plus, Trash2, Edit, MoreVertical, Save } from 'lucide-react'
import { toast } from 'sonner'
import { formatGradeInput, parseGradeInput } from '@/utils/grade-formatter'
import { useAuth } from '@/hooks/use-auth'
import { useStudentAverages } from '@/hooks/use-student-averages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface GradebookTableProps {
  subjectId: string
  gradeId: string
  subjectName: string
  gradeName: string
  collegeId?: string
  onBack: () => void
}

// Componente de input para calificaciones con soporte para decimales
interface GradeInputCellProps {
  value: number
  maxScore: number
  onChange: (value: number) => void
  inputId?: string
  nextInputId?: string
}

function GradeInputCell({
  value,
  maxScore,
  onChange,
  inputId,
  nextInputId,
}: GradeInputCellProps) {
  const [inputValue, setInputValue] = useState<string>(formatGradeInput(value))
  const inputRef = useRef<HTMLInputElement>(null)

  // Solo actualizar desde props cuando el input no tiene foco
  useEffect(() => {
    const newValue = formatGradeInput(value)
    if (document.activeElement !== inputRef.current) {
      setInputValue(newValue)
    }
  }, [value])

  const commitValue = (val: string) => {
    const numericValue = parseGradeInput(val)
    if (numericValue >= 0 && numericValue <= maxScore) {
      onChange(numericValue)
      // Mostrar siempre con un decimal
      setInputValue(numericValue === 0 ? '' : numericValue.toFixed(1))
    } else {
      // Revertir al valor guardado
      setInputValue(formatGradeInput(value))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // Permitir: vacío, dígitos, números decimales como "9", "9.", "9.5", "9,5"
    // Pero validar que no exceda el maxScore
    if (newValue === '' || /^\d*[.,]?\d{0,2}$/.test(newValue)) {
      // Verificar si el valor numérico excedería el máximo permitido
      const normalized = newValue.replace(',', '.')
      if (normalized !== '' && normalized !== '.') {
        const numericValue = parseFloat(normalized)
        if (!isNaN(numericValue) && numericValue > maxScore) {
          // No permitir si excede el máximo
          return
        }
      }
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
      // Navegar al siguiente input
      if (nextInputId) {
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
    <Input
      ref={inputRef}
      id={inputId}
      type='text'
      inputMode='decimal'
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder='-'
      className='h-8 w-full border-0 bg-transparent text-center text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
    />
  )
}

export function GradebookTable({
  subjectId,
  gradeId,
  subjectName,
  gradeName,
  collegeId,
  onBack,
}: GradebookTableProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>(
    {}
  )
  const [colegioSettings, setColegioSettings] = useState<any>(null)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [editingActivity, setEditingActivity] = useState<any>(null)
  const [deletingActivity, setDeletingActivity] = useState<any>(null)
  const [openMenuActivityId, setOpenMenuActivityId] = useState<string | null>(
    null
  )
  const [actitudinalActivityId, setActitudinalActivityId] = useState<string>('')
  const [evaluacionActivityId, setEvaluacionActivityId] = useState<string>('')
  const menuRef = useRef<HTMLDivElement>(null)
  const [newActivity, setNewActivity] = useState({
    name: '',
    category: '',
    type: '',
  })

  // Obtener el maxScore según la configuración del colegio (escala global)
  const getEffectiveMaxScore = () => {
    return colegioSettings?.escala_calificacion === '1-5' ? 5 : 10
  }

  // Use student averages hook
  const { getAverage } = useStudentAverages(students, activities, grades)

  // Calculate total columns: # + Estudiante + filtered activities + Actitudinal + Evaluacion + Nota Final
  const filteredActivities = activities.filter(
    (a) => a.category !== 'actitudinal' && a.category !== 'evaluacion'
  )
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
      let actitudinalActivity = activitiesList.find(
        (a: any) => a.category === 'actitudinal'
      )
      let evaluacionActivity = activitiesList.find(
        (a: any) => a.category === 'evaluacion'
      )

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
            description: 'Nota de comportamiento y actitud',
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
            description: 'Nota de evaluación',
          })
        } catch (e) {
          console.error('Error creating evaluacion activity:', e)
        }
      }

      // Agregar al listado si fueron creadas
      if (
        actitudinalActivity &&
        !activitiesList.find((a: any) => a.id === actitudinalActivity.id)
      ) {
        activitiesList = [...activitiesList, actitudinalActivity]
      }
      if (
        evaluacionActivity &&
        !activitiesList.find((a: any) => a.id === evaluacionActivity.id)
      ) {
        activitiesList = [...activitiesList, evaluacionActivity]
      }

      // Guardar los IDs de las actividades fijas
      const actitudinal = activitiesList.find(
        (a: any) => a.category === 'actitudinal'
      )
      const evaluacion = activitiesList.find(
        (a: any) => a.category === 'evaluacion'
      )
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

  const handleGradeChange = (
    studentId: string,
    activityId: string,
    value: number
  ) => {
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
      graded_by: user?.id,
    }).catch((error) => {
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
      const talleresTypes =
        colegioSettings?.activity_types?.talleres_exposiciones || []

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
        description: newActivity.type, // Guardar el tipo en la descripción
      })

      setActivities([...activities, activity])
      setShowAddActivity(false)
      setNewActivity({
        name: '',
        category: '',
        type: '',
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
      setActivities(activities.filter((a) => a.id !== deletingActivity.id))
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
          <ArrowLeft className='mr-2 h-4 w-4' />
          Volver
        </Button>

        <div className='text-center'>
          <h2 className='text-2xl font-bold'>{subjectName}</h2>
          <p className='text-muted-foreground'>{gradeName}</p>
        </div>

        <div className='flex gap-2'>
          <Button
            onClick={async () => {
              // Guardar todas las calificaciones pendientes
              let savedCount = 0
              for (const [studentId, activities] of Object.entries(grades)) {
                for (const [activityId, score] of Object.entries(
                  activities as Record<string, number>
                )) {
                  if (score > 0) {
                    try {
                      await upsertGradebookEntry({
                        student_id: studentId,
                        activity_id: activityId,
                        score: score,
                        graded_by: user?.id,
                      })
                      savedCount++
                    } catch (error) {
                      console.error('Error guardando:', error)
                    }
                  }
                }
              }
              toast.success(`Calificaciones guardadas (${savedCount})`)
            }}
          >
            <Save className='mr-2 h-4 w-4' />
            Guardar
          </Button>
          <Button onClick={() => setShowAddActivity(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Agregar Actividad
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[40px] rounded-tl-lg border-r bg-gray-100 text-center'>
                #
              </TableHead>
              <TableHead className='border-r bg-gray-100'>Estudiante</TableHead>
              {activities
                .filter(
                  (a) =>
                    a.category !== 'actitudinal' && a.category !== 'evaluacion'
                )
                .map((activity) => {
                  // Formatear la fecha: Mes Día (ej: Feb 3)
                  const fecha = activity.created_at
                    ? (() => {
                        const date = new Date(activity.created_at)
                        const meses = [
                          'Ene',
                          'Feb',
                          'Mar',
                          'Abr',
                          'May',
                          'Jun',
                          'Jul',
                          'Ago',
                          'Sep',
                          'Oct',
                          'Nov',
                          'Dic',
                        ]
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
                      className='relative border-r bg-gray-100 text-left'
                    >
                      <div className='relative py-2 pr-1'>
                        <div className='mb-0.5 text-xs text-muted-foreground'>
                          {fecha}
                        </div>
                        <div
                          className={`truncate pb-0.5 text-sm leading-none ${activityNameMaxWidth}`}
                          title={activity.name}
                        >
                          {activity.name}
                        </div>
                        <div className='mt-0.5 text-xs text-gray-500'>
                          {tipo}
                        </div>
                        <button
                          onClick={() =>
                            setOpenMenuActivityId(
                              openMenuActivityId === activity.id
                                ? null
                                : activity.id
                            )
                          }
                          className='absolute top-1 -right-2 rounded p-0.5 hover:bg-gray-200'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </button>
                        {openMenuActivityId === activity.id && (
                          <div
                            ref={menuRef}
                            className='absolute top-6 right-0 z-10 min-w-[120px] rounded border bg-white shadow-lg'
                          >
                            <button
                              onClick={() => handleEditActivity(activity)}
                              className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100'
                            >
                              <Edit className='h-3 w-3' />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(activity)}
                              className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100'
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
              <TableHead className='w-[100px] border-r bg-gray-100 text-center'>
                {actitudinalActivityId ? 'Actitudinal' : '-'}
              </TableHead>
              <TableHead className='w-[100px] border-r bg-gray-100 text-center'>
                {evaluacionActivityId ? 'Evaluación' : '-'}
              </TableHead>
              <TableHead className='w-[100px] rounded-tr-lg bg-gray-100 text-center'>
                Nota Final
              </TableHead>
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
                  <TableCell className='border-r text-center font-medium'>
                    {index + 1}
                  </TableCell>
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
                  {activities
                    .filter(
                      (a) =>
                        a.category !== 'actitudinal' &&
                        a.category !== 'evaluacion'
                    )
                    .map((activity, activityIndex, filteredActivities) => {
                      const grade = getGradeForEntry(student.id, activity.id)
                      const effectiveMax = getEffectiveMaxScore()
                      // Calcular el índice del siguiente estudiante
                      const nextStudentIndex =
                        index + 1 < students.length ? index + 1 : 0
                      const nextStudent = students[nextStudentIndex]
                      const currentInputId = `grade-${student.id}-${activity.id}`
                      const nextInputId = nextStudent
                        ? `grade-${nextStudent.id}-${activity.id}`
                        : undefined
                      return (
                        <TableCell
                          key={`${student.id}-${activity.id}`}
                          className='border-r'
                        >
                          <GradeInputCell
                            value={grade}
                            maxScore={effectiveMax}
                            onChange={(value) =>
                              handleGradeChange(student.id, activity.id, value)
                            }
                            inputId={currentInputId}
                            nextInputId={nextInputId}
                          />
                        </TableCell>
                      )
                    })}
                  <TableCell className='border-r text-center'>
                    {actitudinalActivityId
                      ? (() => {
                          const nextStudentIndex =
                            index + 1 < students.length ? index + 1 : 0
                          const nextStudent = students[nextStudentIndex]
                          const currentInputId = `grade-${student.id}-${actitudinalActivityId}`
                          const nextInputId = nextStudent
                            ? `grade-${nextStudent.id}-${actitudinalActivityId}`
                            : undefined
                          return (
                            <GradeInputCell
                              value={
                                grades[student.id]?.[actitudinalActivityId] || 0
                              }
                              maxScore={
                                colegioSettings?.escala_calificacion === '1-5'
                                  ? 5
                                  : 10
                              }
                              onChange={(value) =>
                                handleGradeChange(
                                  student.id,
                                  actitudinalActivityId,
                                  value
                                )
                              }
                              inputId={currentInputId}
                              nextInputId={nextInputId}
                            />
                          )
                        })()
                      : '-'}
                  </TableCell>
                  <TableCell className='border-r text-center'>
                    {evaluacionActivityId
                      ? (() => {
                          const nextStudentIndex =
                            index + 1 < students.length ? index + 1 : 0
                          const nextStudent = students[nextStudentIndex]
                          const currentInputId = `grade-${student.id}-${evaluacionActivityId}`
                          const nextInputId = nextStudent
                            ? `grade-${nextStudent.id}-${evaluacionActivityId}`
                            : undefined
                          return (
                            <GradeInputCell
                              value={
                                grades[student.id]?.[evaluacionActivityId] || 0
                              }
                              maxScore={
                                colegioSettings?.escala_calificacion === '1-5'
                                  ? 5
                                  : 10
                              }
                              onChange={(value) =>
                                handleGradeChange(
                                  student.id,
                                  evaluacionActivityId,
                                  value
                                )
                              }
                              inputId={currentInputId}
                              nextInputId={nextInputId}
                            />
                          )
                        })()
                      : '-'}
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
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='mx-4 w-96 max-w-full rounded-lg bg-white p-6'>
            <h3 className='mb-4 text-lg font-semibold'>
              Agregar Nueva Actividad
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>Nombre</label>
                <Input
                  value={newActivity.name}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, name: e.target.value })
                  }
                  placeholder='Nombre de la actividad'
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Tipo</label>
                <Select
                  value={newActivity.type}
                  onValueChange={(value) => {
                    // Determinar la categoría basada en el tipo seleccionado
                    const talleresTypes =
                      colegioSettings?.activity_types?.talleres_exposiciones ||
                      []

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
                    {colegioSettings?.activity_types?.apuntes_tareas?.map(
                      (type: string) => (
                        <SelectItem key={`apuntes-${type}`} value={type}>
                          {type}
                        </SelectItem>
                      )
                    )}
                    {colegioSettings?.activity_types?.talleres_exposiciones?.map(
                      (type: string) => (
                        <SelectItem key={`talleres-${type}`} value={type}>
                          {type}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => setShowAddActivity(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddActivity}>Agregar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Activity Dialog */}
      {editingActivity && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='mx-4 w-96 max-w-full rounded-lg bg-white p-6'>
            <h3 className='mb-4 text-lg font-semibold'>Editar Actividad</h3>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>Nombre</label>
                <Input
                  value={editingActivity.name}
                  onChange={(e) =>
                    setEditingActivity({
                      ...editingActivity,
                      name: e.target.value,
                    })
                  }
                  placeholder='Nombre de la actividad'
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Tipo</label>
                <Select
                  value={
                    editingActivity.description || editingActivity.category
                  }
                  onValueChange={(value) => {
                    // Determinar la categoría basada en el tipo seleccionado
                    const talleresTypes =
                      colegioSettings?.activity_types?.talleres_exposiciones ||
                      []

                    let category = 'apuntes_tareas'
                    if (talleresTypes.includes(value)) {
                      category = 'talleres_exposiciones'
                    }

                    setEditingActivity({
                      ...editingActivity,
                      category,
                      description: value,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Seleccionar tipo' />
                  </SelectTrigger>
                  <SelectContent>
                    {colegioSettings?.activity_types?.apuntes_tareas?.map(
                      (type: string) => (
                        <SelectItem key={`apuntes-${type}`} value={type}>
                          {type}
                        </SelectItem>
                      )
                    )}
                    {colegioSettings?.activity_types?.talleres_exposiciones?.map(
                      (type: string) => (
                        <SelectItem key={`talleres-${type}`} value={type}>
                          {type}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => setEditingActivity(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    // Actualizar la actividad en la base de datos
                    const { updateActivity } =
                      await import('@/services/gradebook')
                    await updateActivity(editingActivity.id, {
                      name: editingActivity.name,
                      category: editingActivity.category,
                      description: editingActivity.description,
                    })

                    // Actualizar el estado local
                    setActivities(
                      activities.map((a) =>
                        a.id === editingActivity.id
                          ? {
                              ...a,
                              name: editingActivity.name,
                              category: editingActivity.category,
                              description: editingActivity.description,
                            }
                          : a
                      )
                    )
                    setEditingActivity(null)
                    toast.success('Actividad actualizada exitosamente')
                  } catch (error) {
                    console.error('Error updating activity:', error)
                    toast.error('Error al actualizar la actividad')
                  }
                }}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Activity Confirmation Dialog */}
      {deletingActivity && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='mx-4 w-96 max-w-full rounded-lg bg-white p-6'>
            <h3 className='mb-4 text-lg font-semibold'>Eliminar Actividad</h3>
            <p className='mb-6 text-muted-foreground'>
              ¿Estás seguro de que deseas eliminar la actividad "
              {deletingActivity.name}"? Esta acción no se puede deshacer y se
              eliminarán todas las calificaciones asociadas.
            </p>
            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => setDeletingActivity(null)}
              >
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

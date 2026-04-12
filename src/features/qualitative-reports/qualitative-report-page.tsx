import { useState, useEffect } from 'react'
import { getAlumnosByGrade } from '@/services/alumnos'
import { getAssignmentsByTeacher, getGrades } from '@/services/assignments'
import { getGradebookData, getActivities } from '@/services/gradebook'
import {
  getQualitativeReports,
  upsertQualitativeReport,
  QualitativeReport,
  CreateQualitativeReportDTO,
} from '@/services/qualitative-reports'
import {
  Users,
  BookOpen,
  FileText,
  Save,
  ChevronLeft,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { sortGradesEducationally } from '@/utils/grade-ordering'
import { useAuth } from '@/hooks/use-auth'
import { useColegio } from '@/hooks/use-colegio'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
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

interface SubjectWithGrades {
  subjectName: string
  subjectId: string
  grades: { id: string; name: string }[]
  collegeId?: string
}

interface ActivityNotDelivered {
  name: string
  category: string
  activity_type: string
  created_at: string
}

interface ActivityWithPositivePerformance {
  name: string
  category: string
  grade: number
  performance: 'basico' | 'alto' | 'superior'
  created_at: string
}

interface StudentReport {
  id: string
  name: string
  last_name: string
  colegio_id: string
  colegio_name: string
  grade_id: string
  grade_name: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at?: string
  report?: QualitativeReport
  activities_not_delivered: ActivityNotDelivered[]
  activities_json: string // Para guardar en BD
  insufficient_activities: string
  positive_notes: string
  behavioral_issues: 'Sí' | 'No'
  attendance_issues: 'Sí' | 'No'
  personal_presentation: string
  observations: string
}

interface GradeApp {
  id: string
  name: string
  desc: string
  subjectId: string
  subjectName: string
  collegeId?: string
}

export function QualitativeReportPage() {
  const [subjects, setSubjects] = useState<SubjectWithGrades[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1')
  const [students, setStudents] = useState<StudentReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showReportTable, setShowReportTable] = useState(false)
  const [selectedGradebook, setSelectedGradebook] = useState<{
    subjectId: string
    gradeId: string
    subjectName: string
    gradeName: string
    collegeId: string
  } | null>(null)
  const { user, isDocente } = useAuth()
  const { selectedColegio } = useColegio()

  useEffect(() => {
    if (user && isDocente && selectedColegio) {
      loadTeacherAssignments()
    }
  }, [user, isDocente, selectedColegio])

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].subjectId)
    }
  }, [subjects])

  useEffect(() => {
    if (selectedGradebook) {
      loadStudentsAndReports()
    }
  }, [selectedGradebook, selectedPeriod])

  const loadTeacherAssignments = async () => {
    if (!user?.id) return

    try {
      const assignmentsData = await getAssignmentsByTeacher(user.id)
      const filteredAssignments = selectedColegio
        ? assignmentsData.filter((a) => a.colegio_id === selectedColegio)
        : assignmentsData

      const allGrades = await getGrades()
      const gradeMap = new Map(allGrades.map((g) => [g.id, g.name]))

      const subjectsMap = new Map<string, SubjectWithGrades>()

      filteredAssignments.forEach((assignment) => {
        const subjectKey = assignment.subject_id
        const subjectName = assignment.subject_name || 'Sin materia'
        const collegeId = assignment.colegio_id

        if (!subjectsMap.has(subjectKey)) {
          subjectsMap.set(subjectKey, {
            subjectName,
            subjectId: subjectKey,
            grades: [],
            collegeId,
          })
        }

        const gradeIds =
          assignment.grade_ids ||
          (assignment.grade_id ? [assignment.grade_id] : [])

        gradeIds.forEach((gradeId: string) => {
          if (!gradeId) return
          const existingGrade = subjectsMap
            .get(subjectKey)!
            .grades.find((g) => g.id === gradeId)
          if (!existingGrade) {
            subjectsMap.get(subjectKey)!.grades.push({
              id: gradeId,
              name: gradeMap.get(gradeId) || 'Sin grado',
            })
          }
        })
      })

      const subjectsArray = Array.from(subjectsMap.values())
      subjectsArray.forEach((subject) => {
        subject.grades = sortGradesEducationally(subject.grades)
      })
      subjectsArray.sort((a, b) => a.subjectName.localeCompare(b.subjectName))

      setSubjects(subjectsArray)
    } catch (error) {
      console.error('Error loading assignments:', error)
      toast.error('Error al cargar las asignaciones')
    }
  }

  const loadStudentsAndReports = async () => {
    if (!selectedGradebook || !selectedColegio) return

    setIsLoading(true)
    try {
      // Cargar estudiantes del grado
      const alumnosData = await getAlumnosByGrade(
        selectedGradebook.gradeId,
        selectedColegio
      )

      // Cargar actividades de la materia y grado
      const activities = await getActivities(
        selectedGradebook.subjectId,
        selectedGradebook.gradeId
      )

      // Cargar datos de la libreta para ver qué actividades tienen notas
      const gradebookData = await getGradebookData(
        selectedGradebook.subjectId,
        selectedGradebook.gradeId
      )

      // Cargar informes cualitativos existentes
      const reports = await getQualitativeReports({
        subject_id: selectedGradebook.subjectId,
        grade_id: selectedGradebook.gradeId,
        period: parseInt(selectedPeriod),
        academic_year: 2026,
      })

      // Combinar estudiantes con sus informes
      const studentsWithReports: StudentReport[] = alumnosData.map((alumno) => {
        const existingReport = reports.find((r) => r.student_id === alumno.id)
        const behavioralValue = existingReport?.behavioral_issues
        const attendanceValue = existingReport?.attendance_issues

        // Calcular automáticamente las actividades sin nota
        const activitiesNotDelivered: ActivityNotDelivered[] = []

        if (gradebookData.grades[alumno.id]) {
          activities.forEach((activity) => {
            // Solo incluir actividades de apuntes/tareas y talleres/exposiciones
            // Excluir actitudinal y evaluación
            if (
              activity.category === 'actitudinal' ||
              activity.category === 'evaluacion'
            ) {
              return
            }

            const studentGrades = gradebookData.grades[alumno.id]
            const hasGrade =
              studentGrades &&
              studentGrades[activity.id] !== undefined &&
              studentGrades[activity.id] > 0

            if (!hasGrade) {
              // El tipo específico de actividad se guarda en description
              const activityType = activity.description || activity.category

              // Formatear la fecha (solo mes y día)
              const activityDate = new Date(activity.created_at)
              const formattedDate = activityDate.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
              })

              activitiesNotDelivered.push({
                name: activity.name,
                category: activity.category,
                activity_type: activityType,
                created_at: formattedDate,
              })
            }
          })
        }

        // Convertir el array a JSON string para guardar en la BD
        const activitiesJson =
          activitiesNotDelivered.length > 0
            ? JSON.stringify(activitiesNotDelivered)
            : ''

        return {
          ...alumno,
          report: existingReport,
          activities_not_delivered: activitiesNotDelivered,
          activities_json: activitiesJson, // Para guardar en BD
          insufficient_activities:
            existingReport?.insufficient_activities || '',
          positive_notes: existingReport?.positive_notes || '',
          behavioral_issues: behavioralValue === 'Sí' ? 'Sí' : 'No',
          attendance_issues: attendanceValue === 'Sí' ? 'Sí' : 'No',
          personal_presentation: existingReport?.personal_presentation || '',
          observations: existingReport?.observations || '',
        }
      })

      setStudents(studentsWithReports)
    } catch (error) {
      console.error('Error loading students and reports:', error)
      toast.error('Error al cargar los estudiantes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenReport = (gradeApp: GradeApp) => {
    setSelectedGradebook({
      subjectId: gradeApp.subjectId,
      gradeId: gradeApp.id,
      subjectName: gradeApp.subjectName,
      gradeName: gradeApp.name,
      collegeId: gradeApp.collegeId || selectedColegio || '',
    })
    setShowReportTable(true)
  }

  const handleBackToSelection = () => {
    setShowReportTable(false)
    setSelectedGradebook(null)
    setStudents([])
  }

  const handleInputChange = (
    studentId: string,
    field: keyof StudentReport,
    value: string
  ) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, [field]: value } : student
      )
    )
  }

  const handleSaveReport = async (student: StudentReport) => {
    if (!user?.id || !selectedColegio || !selectedGradebook) return

    setIsSaving(true)
    try {
      const reportData: CreateQualitativeReportDTO = {
        student_id: student.id,
        subject_id: selectedGradebook.subjectId,
        grade_id: selectedGradebook.gradeId,
        period: parseInt(selectedPeriod),
        teacher_id: user.id,
        colegio_id: selectedColegio,
        academic_year: 2026,
        activities_not_delivered: student.activities_json,
        insufficient_activities: student.insufficient_activities,
        positive_notes: student.positive_notes,
        behavioral_issues: student.behavioral_issues,
        attendance_issues: student.attendance_issues,
        personal_presentation: student.personal_presentation,
        observations: student.observations,
        status: 'draft',
      }

      await upsertQualitativeReport(reportData)
      toast.success(
        `Informe guardado para ${student.name} ${student.last_name}`
      )
    } catch (error) {
      console.error('Error saving report:', error)
      toast.error('Error al guardar el informe')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAll = async () => {
    if (!user?.id || !selectedColegio || !selectedGradebook) return

    setIsSaving(true)
    try {
      for (const student of students) {
        const reportData: CreateQualitativeReportDTO = {
          student_id: student.id,
          subject_id: selectedGradebook.subjectId,
          grade_id: selectedGradebook.gradeId,
          period: parseInt(selectedPeriod),
          teacher_id: user.id,
          colegio_id: selectedColegio,
          academic_year: 2026,
          activities_not_delivered: student.activities_json,
          insufficient_activities: student.insufficient_activities,
          positive_notes: student.positive_notes,
          behavioral_issues: student.behavioral_issues,
          attendance_issues: student.attendance_issues,
          personal_presentation: student.personal_presentation,
          observations: student.observations,
          status: 'draft',
        }
        await upsertQualitativeReport(reportData)
      }
      toast.success('Todos los informes han sido guardados')
    } catch (error) {
      console.error('Error saving all reports:', error)
      toast.error('Error al guardar los informes')
    } finally {
      setIsSaving(false)
    }
  }

  const currentSubject = subjects.find((s) => s.subjectId === selectedSubject)

  // Función para exportar a PDF
  const handleExportPDF = () => {
    if (!selectedGradebook || students.length === 0) return

    try {
      // Importar jsPDF dinámicamente
      import('jspdf').then(({ jsPDF }) => {
        import('jspdf-autotable').then((autoTable) => {
          const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
          })

          // Configurar fuente
          doc.setFont('helvetica', 'normal')

          // Título
          doc.setFontSize(16)
          doc.text('INFORME PRELIMINAR', 148, 15, { align: 'center' })

          // Subtítulo
          doc.setFontSize(12)
          doc.text(`Asignatura: ${selectedGradebook.subjectName}`, 14, 25)
          doc.text(`Grado: ${selectedGradebook.gradeName}`, 14, 32)
          doc.text(`Período: ${selectedPeriod}`, 14, 39)
          doc.text(`Año Lectivo: 2026`, 14, 46)

          // Preparar datos para la tabla
          const tableData = students.map((student, index) => [
            (index + 1).toString(),
            `${student.name} ${student.last_name}`,
            student.activities_not_delivered || '',
            student.insufficient_activities || '',
            student.positive_notes || '',
            student.behavioral_issues,
            student.attendance_issues,
            student.personal_presentation || '',
            student.observations || '',
          ])

          // Crear tabla
          const tableHeaders = [
            'N°',
            'Estudiante',
            'Actividades no entregadas',
            'Act. Insuficientes',
            'Notas Positivas',
            'Probl. Convivencia',
            'Faltas/Tarde',
            'Presentación',
            'Observaciones',
          ]

          // @ts-ignore - autoTable es agregado por jspdf-autotable
          doc.autoTable({
            head: [tableHeaders],
            body: tableData,
            startY: 55,
            theme: 'grid',
            styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak',
              minCellHeight: 10,
            },
            headStyles: {
              fillColor: [41, 128, 185],
              textColor: [255, 255, 255],
              fontSize: 8,
              fontStyle: 'bold',
            },
            columnStyles: {
              0: { cellWidth: 10 },
              1: { cellWidth: 40 },
              2: { cellWidth: 35 },
              3: { cellWidth: 25 },
              4: { cellWidth: 25 },
              5: { cellWidth: 20 },
              6: { cellWidth: 20 },
              7: { cellWidth: 25 },
              8: { cellWidth: 40 },
            },
          })

          // Pie de página
          const pageCount = doc.getNumberOfPages()
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.text(`Página ${i} de ${pageCount}`, 280, 200, {
              align: 'right',
            })
          }

          // Guardar PDF
          doc.save(
            `informe_cualitativo_${selectedGradebook.gradeName}_${selectedGradebook.subjectName}_periodo${selectedPeriod}.pdf`
          )

          toast.success('PDF exportado exitosamente')
        })
      })
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Error al exportar PDF')
    }
  }

  // Convertir a formato de apps para cada grado
  const gradesAsApps: GradeApp[] = []
  if (currentSubject) {
    currentSubject.grades.forEach((grade) => {
      gradesAsApps.push({
        id: grade.id,
        name: grade.name,
        desc: 'Generar informe preliminar para este grado',
        subjectId: currentSubject.subjectId,
        subjectName: currentSubject.subjectName,
        collegeId: currentSubject.collegeId,
      })
    })
  }

  if (!isDocente) {
    return (
      <ProtectedRoute>
        <div className='flex min-h-screen items-center justify-center'>
          <Card className='max-w-md'>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <Users className='mb-4 h-12 w-12 text-muted-foreground' />
              <h3 className='mb-2 text-lg font-semibold'>Acceso Restringido</h3>
              <p className='text-center text-muted-foreground'>
                Esta página está disponible únicamente para docentes.
              </p>
            </CardContent>
          </Card>
        </div>
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

      <Main fluid>
        {showReportTable && selectedGradebook ? (
          // Vista de la tabla del informe
          <div className='space-y-6'>
            {/* Header con botón de regreso */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleBackToSelection}
                >
                  <ChevronLeft className='mr-2 h-4 w-4' />
                  Volver
                </Button>
                <div>
                  <h1 className='text-2xl font-bold tracking-tight'>
                    Informe Preliminar
                  </h1>
                  <p className='text-muted-foreground'>
                    {selectedGradebook.subjectName} -{' '}
                    {selectedGradebook.gradeName} - Período {selectedPeriod}
                  </p>
                </div>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={handleExportPDF}
                  disabled={students.length === 0}
                >
                  <Download className='mr-2 h-4 w-4' />
                  Exportar PDF
                </Button>
                <Button
                  onClick={handleSaveAll}
                  disabled={isSaving || students.length === 0}
                >
                  <Save className='mr-2 h-4 w-4' />
                  {isSaving ? 'Guardando...' : 'Guardar Todo'}
                </Button>
              </div>
            </div>

            {/* Tabla del informe */}
            {isLoading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-primary'></div>
              </div>
            ) : students.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
                <Users className='mb-4 h-12 w-12' />
                <p>No hay estudiantes en este grado.</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <div className='overflow-hidden rounded-lg border'>
                  <table className='w-full border-collapse'>
                    <thead>
                      <tr className='bg-gray-50'>
                        <th className='w-12 rounded-tl-lg border border-gray-300 bg-gray-50 px-2 py-2 text-center'>
                          <div className='text-sm leading-none font-medium'>
                            N°
                          </div>
                        </th>
                        <th className='min-w-48 border border-gray-300 bg-gray-50 px-4 py-2 text-left'>
                          <div className='text-sm leading-none font-medium'>
                            Estudiante
                          </div>
                        </th>
                        <th className='min-w-[200px] border border-gray-300 bg-gray-50 px-4 py-2 text-left'>
                          <div className='text-sm leading-none font-medium'>
                            Actividades que no ha entregado
                          </div>
                        </th>
                        <th className='min-w-[160px] border border-gray-300 bg-gray-50 px-4 py-2 text-left'>
                          <div className='text-sm leading-none font-medium'>
                            Actividades con notas insuficientes
                          </div>
                        </th>
                        <th className='min-w-[160px] border border-gray-300 bg-gray-50 px-4 py-2 text-left'>
                          <div className='text-sm leading-none font-medium'>
                            Actividades con notas positivas
                          </div>
                        </th>
                        <th className='w-24 border border-gray-300 bg-gray-50 px-2 py-2 text-center'>
                          <div className='text-sm leading-none font-medium'>
                            Probl. Convivencia
                          </div>
                        </th>
                        <th className='w-24 border border-gray-300 bg-gray-50 px-2 py-2 text-center'>
                          <div className='text-sm leading-none font-medium'>
                            Faltas/Tarde
                          </div>
                        </th>
                        <th className='min-w-[140px] border border-gray-300 bg-gray-50 px-4 py-2 text-left'>
                          <div className='text-sm leading-none font-medium'>
                            Presentación Personal
                          </div>
                        </th>
                        <th className='min-w-[180px] border border-gray-300 bg-gray-50 px-4 py-2 text-left'>
                          <div className='text-sm leading-none font-medium'>
                            Observaciones
                          </div>
                        </th>
                        <th className='w-16 rounded-tr-lg border border-gray-300 bg-gray-50 px-2 py-2 text-center'>
                          <div className='flex justify-center'>
                            <Save className='h-4 w-4' />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={student.id} className='hover:bg-gray-50'>
                          <td
                            className={`w-12 border border-gray-300 bg-white px-2 py-2 text-center font-medium ${index === students.length - 1 ? 'rounded-bl-lg' : ''}`}
                          >
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
                          <td className='border border-gray-300 bg-white px-4 py-2'>
                            <div className='max-h-[150px] overflow-y-auto'>
                              {(
                                student.activities_not_delivered as ActivityNotDelivered[]
                              ).length > 0 ? (
                                <ul className='list-inside list-disc space-y-1 text-xs'>
                                  {(
                                    student.activities_not_delivered as ActivityNotDelivered[]
                                  ).map((activity, idx) => (
                                    <li key={idx} className='leading-tight'>
                                      <span className='inline-flex items-center text-[10px] font-medium whitespace-nowrap text-blue-600'>
                                        {activity.activity_type}:
                                      </span>{' '}
                                      <span className='leading-tight'>
                                        {activity.name}
                                      </span>{' '}
                                      <span className='text-[10px] whitespace-nowrap text-gray-500'>
                                        ({activity.created_at})
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className='text-xs text-gray-400 italic'>
                                  Sin actividades pendientes
                                </span>
                              )}
                            </div>
                          </td>
                          <td className='border border-gray-300 bg-white p-0'>
                            <textarea
                              value={student.insufficient_activities}
                              onChange={(e) =>
                                handleInputChange(
                                  student.id,
                                  'insufficient_activities',
                                  e.target.value
                                )
                              }
                              className='h-full w-full resize-none appearance-none border-0 bg-transparent px-1 py-1 text-sm focus:outline-none'
                              style={{ minHeight: '40px' }}
                              placeholder='Actividades con nota baja...'
                            />
                          </td>
                          <td className='border border-gray-300 bg-white p-0'>
                            <textarea
                              value={student.positive_notes}
                              onChange={(e) =>
                                handleInputChange(
                                  student.id,
                                  'positive_notes',
                                  e.target.value
                                )
                              }
                              className='h-full w-full resize-none appearance-none border-0 bg-transparent px-1 py-1 text-sm focus:outline-none'
                              style={{ minHeight: '40px' }}
                              placeholder='Aspectos positivos...'
                            />
                          </td>
                          <td className='w-24 border border-gray-300 bg-white p-0'>
                            <input
                              type='text'
                              inputMode='decimal'
                              value={student.behavioral_issues}
                              onChange={(e) =>
                                handleInputChange(
                                  student.id,
                                  'behavioral_issues',
                                  e.target.value
                                )
                              }
                              placeholder='No'
                              className='h-full w-full appearance-none border-0 px-1 py-1 text-center text-sm focus:outline-none'
                              style={{ minHeight: '40px' }}
                            />
                          </td>
                          <td className='w-24 border border-gray-300 bg-white p-0'>
                            <input
                              type='text'
                              inputMode='decimal'
                              value={student.attendance_issues}
                              onChange={(e) =>
                                handleInputChange(
                                  student.id,
                                  'attendance_issues',
                                  e.target.value
                                )
                              }
                              placeholder='No'
                              className='h-full w-full appearance-none border-0 px-1 py-1 text-center text-sm focus:outline-none'
                              style={{ minHeight: '40px' }}
                            />
                          </td>
                          <td className='border border-gray-300 bg-white p-0'>
                            <textarea
                              value={student.personal_presentation}
                              onChange={(e) =>
                                handleInputChange(
                                  student.id,
                                  'personal_presentation',
                                  e.target.value
                                )
                              }
                              className='h-full w-full resize-none appearance-none border-0 bg-transparent px-1 py-1 text-sm focus:outline-none'
                              style={{ minHeight: '40px' }}
                              placeholder='Presentación personal...'
                            />
                          </td>
                          <td className='border border-gray-300 bg-white p-0'>
                            <textarea
                              value={student.observations}
                              onChange={(e) =>
                                handleInputChange(
                                  student.id,
                                  'observations',
                                  e.target.value
                                )
                              }
                              className='h-full w-full resize-none appearance-none border-0 bg-transparent px-1 py-1 text-sm focus:outline-none'
                              style={{ minHeight: '40px' }}
                              placeholder='Observaciones generales...'
                            />
                          </td>
                          <td
                            className={`w-16 border border-gray-300 bg-white px-1 py-1 font-medium ${index === students.length - 1 ? 'rounded-br-lg' : ''}`}
                          >
                            <div
                              className='flex h-full items-center justify-center'
                              style={{ minHeight: '40px' }}
                            >
                              <button
                                onClick={() => handleSaveReport(student)}
                                disabled={isSaving}
                                className='flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100'
                              >
                                <Save className='h-4 w-4' />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Vista de selección de materia y grados
          <div className='space-y-6'>
            <div>
              <div className='flex items-center justify-between'>
                <div>
                  <h1 className='text-2xl font-bold tracking-tight'>
                    Informe Preliminar
                  </h1>
                  <p className='text-muted-foreground'>
                    Selecciona una materia y grado para generar el informe.
                  </p>
                </div>
              </div>
            </div>

            {subjects.length === 0 ? (
              <Card>
                <CardContent className='flex flex-col items-center justify-center py-12'>
                  <BookOpen className='mb-4 h-12 w-12 text-muted-foreground' />
                  <h3 className='mb-2 text-lg font-semibold'>
                    No tienes asignaciones
                  </h3>
                  <p className='mb-4 text-center text-muted-foreground'>
                    {selectedColegio || selectedColegio !== null
                      ? 'No se encontraron materias asignadas en este colegio.'
                      : 'Selecciona un colegio para ver tus asignaciones.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className='flex items-end justify-between space-y-2'>
                  <div className='flex flex-col gap-4 md:flex-row'>
                    <Input
                      placeholder='Filtrar grados...'
                      className='h-9 w-40 lg:w-[250px]'
                    />
                    <Select
                      value={selectedSubject}
                      onValueChange={setSelectedSubject}
                    >
                      <SelectTrigger className='w-36'>
                        <SelectValue placeholder='Materia' />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem
                            key={subject.subjectId}
                            value={subject.subjectId}
                          >
                            {subject.subjectName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedPeriod}
                      onValueChange={setSelectedPeriod}
                    >
                      <SelectTrigger className='w-32'>
                        <SelectValue placeholder='Período' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='1'>Período 1</SelectItem>
                        <SelectItem value='2'>Período 2</SelectItem>
                        <SelectItem value='3'>Período 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Badge variant='secondary' className='h-9 px-3'>
                    {currentSubject?.grades.length || 0} grados
                  </Badge>
                </div>
                <Separator className='shadow-sm' />

                <ul className='grid gap-4 overflow-auto pt-4 pb-16 md:grid-cols-2 lg:grid-cols-3'>
                  {gradesAsApps.map((gradeApp) => (
                    <li
                      key={gradeApp.id}
                      className='cursor-pointer rounded-lg border p-4 transition-shadow hover:shadow-md'
                      onClick={() => handleOpenReport(gradeApp)}
                    >
                      <div className='mb-8 flex items-center justify-between'>
                        <div
                          className={`flex size-10 items-center justify-center rounded-lg bg-muted p-2`}
                        >
                          <Users className='h-5 w-5' />
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenReport(gradeApp)
                          }}
                        >
                          <FileText className='mr-2 h-4 w-4' />
                          Informe
                        </Button>
                      </div>
                      <div>
                        <h2 className='mb-1 font-semibold'>{gradeApp.name}</h2>
                        <p className='line-clamp-2 text-gray-500'>
                          {gradeApp.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </Main>
    </ProtectedRoute>
  )
}

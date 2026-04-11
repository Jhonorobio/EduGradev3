import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useColegio } from '@/hooks/use-colegio'
import { getAssignmentsByTeacher, getGrades } from '@/services/assignments'
import { getAlumnosByGrade } from '@/services/alumnos'
import { sortGradesEducationally } from '@/utils/grade-ordering'
import { Users, BookOpen, FileText, Save, ChevronLeft, Download } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'
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
import {
  getQualitativeReports,
  upsertQualitativeReport,
  QualitativeReport,
  CreateQualitativeReportDTO,
} from '@/services/qualitative-reports'
import { getGradebookData, getActivities } from '@/services/gradebook'

interface SubjectWithGrades {
  subjectName: string
  subjectId: string
  grades: { id: string; name: string }[]
  collegeId?: string
}

interface ActivityNotDelivered {
  name: string;
  category: string;
  created_at: string;
}

interface StudentReport {
  id: string;
  name: string;
  last_name: string;
  colegio_id: string;
  colegio_name: string;
  grade_id: string;
  grade_name: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at?: string;
  report?: QualitativeReport;
  activities_not_delivered: ActivityNotDelivered[];
  activities_json: string; // Para guardar en BD
  insufficient_activities: string;
  positive_notes: string;
  behavioral_issues: 'Sí' | 'No';
  attendance_issues: 'Sí' | 'No';
  personal_presentation: string;
  observations: string;
}

interface GradeApp {
  id: string;
  name: string;
  desc: string;
  subjectId: string;
  subjectName: string;
  collegeId?: string;
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
        ? assignmentsData.filter(a => a.colegio_id === selectedColegio)
        : assignmentsData

      const allGrades = await getGrades()
      const gradeMap = new Map(allGrades.map(g => [g.id, g.name]))

      const subjectsMap = new Map<string, SubjectWithGrades>()

      filteredAssignments.forEach(assignment => {
        const subjectKey = assignment.subject_id
        const subjectName = assignment.subject_name || 'Sin materia'
        const collegeId = assignment.colegio_id

        if (!subjectsMap.has(subjectKey)) {
          subjectsMap.set(subjectKey, {
            subjectName,
            subjectId: subjectKey,
            grades: [],
            collegeId
          })
        }

        const gradeIds = assignment.grade_ids || (assignment.grade_id ? [assignment.grade_id] : [])

        gradeIds.forEach((gradeId: string) => {
          if (!gradeId) return
          const existingGrade = subjectsMap.get(subjectKey)!.grades.find(g => g.id === gradeId)
          if (!existingGrade) {
            subjectsMap.get(subjectKey)!.grades.push({
              id: gradeId,
              name: gradeMap.get(gradeId) || 'Sin grado'
            })
          }
        })
      })

      const subjectsArray = Array.from(subjectsMap.values())
      subjectsArray.forEach(subject => {
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
      const alumnosData = await getAlumnosByGrade(selectedGradebook.gradeId, selectedColegio)
      
      // Cargar actividades de la materia y grado
      const activities = await getActivities(selectedGradebook.subjectId, selectedGradebook.gradeId)
      
      // Cargar datos de la libreta para ver qué actividades tienen notas
      const gradebookData = await getGradebookData(selectedGradebook.subjectId, selectedGradebook.gradeId)
      
      // Cargar informes cualitativos existentes
      const reports = await getQualitativeReports({
        subject_id: selectedGradebook.subjectId,
        grade_id: selectedGradebook.gradeId,
        period: parseInt(selectedPeriod),
        academic_year: 2026
      })

      // Combinar estudiantes con sus informes
      const studentsWithReports: StudentReport[] = alumnosData.map(alumno => {
        const existingReport = reports.find(r => r.student_id === alumno.id)
        const behavioralValue = existingReport?.behavioral_issues
        const attendanceValue = existingReport?.attendance_issues
        
        // Calcular automáticamente las actividades sin nota
        const activitiesNotDelivered: ActivityNotDelivered[] = []
        
        if (gradebookData.grades[alumno.id]) {
          activities.forEach(activity => {
            const studentGrades = gradebookData.grades[alumno.id]
            const hasGrade = studentGrades && studentGrades[activity.id] !== undefined && studentGrades[activity.id] > 0
            
            if (!hasGrade) {
              // Formatear la categoría para mostrar
              const categoryLabels: Record<string, string> = {
                'apuntes_tareas': 'Apuntes/Tareas',
                'talleres_exposiciones': 'Talleres/Exposiciones',
                'actitudinal': 'Actitudinal',
                'evaluacion': 'Evaluación'
              }
              
              // Formatear la fecha (solo mes y día)
              const activityDate = new Date(activity.created_at)
              const formattedDate = activityDate.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short'
              })
              
              activitiesNotDelivered.push({
                name: activity.name,
                category: categoryLabels[activity.category] || activity.category,
                created_at: formattedDate
              })
            }
          })
        }
        
        // Convertir el array a JSON string para guardar en la BD
        const activitiesJson = activitiesNotDelivered.length > 0 
          ? JSON.stringify(activitiesNotDelivered) 
          : ''
        
        return {
          ...alumno,
          report: existingReport,
          activities_not_delivered: activitiesNotDelivered,
          activities_json: activitiesJson, // Para guardar en BD
          insufficient_activities: existingReport?.insufficient_activities || '',
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
      collegeId: gradeApp.collegeId || selectedColegio || ''
    })
    setShowReportTable(true)
  }

  const handleBackToSelection = () => {
    setShowReportTable(false)
    setSelectedGradebook(null)
    setStudents([])
  }

  const handleInputChange = (studentId: string, field: keyof StudentReport, value: string) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, [field]: value }
        : student
    ))
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
        status: 'draft'
      }

      await upsertQualitativeReport(reportData)
      toast.success(`Informe guardado para ${student.name} ${student.last_name}`)
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
          status: 'draft'
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

  const currentSubject = subjects.find(s => s.subjectId === selectedSubject)

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
            format: 'a4'
          })

          // Configurar fuente
          doc.setFont('helvetica', 'normal')
          
          // Título
          doc.setFontSize(16)
          doc.text('INFORME CUALITATIVO', 148, 15, { align: 'center' })
          
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
            student.observations || ''
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
            'Observaciones'
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
              minCellHeight: 10
            },
            headStyles: {
              fillColor: [41, 128, 185],
              textColor: [255, 255, 255],
              fontSize: 8,
              fontStyle: 'bold'
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
              8: { cellWidth: 40 }
            }
          })

          // Pie de página
          const pageCount = doc.getNumberOfPages()
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.text(`Página ${i} de ${pageCount}`, 280, 200, { align: 'right' })
          }

          // Guardar PDF
          doc.save(`informe_cualitativo_${selectedGradebook.gradeName}_${selectedGradebook.subjectName}_periodo${selectedPeriod}.pdf`)
          
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
    currentSubject.grades.forEach(grade => {
      gradesAsApps.push({
        id: grade.id,
        name: grade.name,
        desc: 'Generar informe cualitativo para este grado',
        subjectId: currentSubject.subjectId,
        subjectName: currentSubject.subjectName,
        collegeId: currentSubject.collegeId
      })
    })
  }

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
                  <ChevronLeft className='h-4 w-4 mr-2' />
                  Volver
                </Button>
                <div>
                  <h1 className='text-2xl font-bold tracking-tight'>
                    Informe Cualitativo
                  </h1>
                  <p className='text-muted-foreground'>
                    {selectedGradebook.subjectName} - {selectedGradebook.gradeName} - Período {selectedPeriod}
                  </p>
                </div>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={handleExportPDF}
                  disabled={students.length === 0}
                >
                  <Download className='h-4 w-4 mr-2' />
                  Exportar PDF
                </Button>
                <Button
                  onClick={handleSaveAll}
                  disabled={isSaving || students.length === 0}
                >
                  <Save className='h-4 w-4 mr-2' />
                  {isSaving ? 'Guardando...' : 'Guardar Todo'}
                </Button>
              </div>
            </div>

            {/* Tabla del informe */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Informe Cualitativo - Año Lectivo 2026</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                  </div>
                ) : students.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
                    <Users className='h-12 w-12 mb-4' />
                    <p>No hay estudiantes en este grado.</p>
                  </div>
                ) : (
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow className='bg-muted/50'>
                          <TableHead className='w-[60px] text-center'>N°</TableHead>
                          <TableHead className='min-w-[200px]'>Nombre del Estudiante</TableHead>
                          <TableHead className='min-w-[200px] text-xs'>
                            Actividades que<br/>no ha entregado
                          </TableHead>
                          <TableHead className='min-w-[150px] text-xs'>
                            Actividades<br/>Insuficientes
                          </TableHead>
                          <TableHead className='min-w-[150px] text-xs'>
                            Notas<br/>Positivas
                          </TableHead>
                          <TableHead className='w-[100px] text-center text-xs'>
                            Problemas de<br/>Convivencia
                          </TableHead>
                          <TableHead className='w-[100px] text-center text-xs'>
                            Faltas/Llegadas<br/>Tarde
                          </TableHead>
                          <TableHead className='min-w-[150px] text-xs'>
                            Presentación<br/>Personal
                          </TableHead>
                          <TableHead className='min-w-[200px]'>Observaciones</TableHead>
                          <TableHead className='w-[100px]'>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student, index) => (
                          <TableRow key={student.id}>
                            <TableCell className='text-center font-medium'>
                              {index + 1}
                            </TableCell>
                            <TableCell className='font-medium'>
                              {student.name} {student.last_name}
                            </TableCell>
                        <TableCell className='align-top'>
                          <div className='max-h-[200px] overflow-y-auto'>
                            {(student.activities_not_delivered as ActivityNotDelivered[]).length > 0 ? (
                              <ul className='list-disc pl-4 space-y-1 text-xs'>
                                {(student.activities_not_delivered as ActivityNotDelivered[]).map((activity, idx) => (
                                  <li key={idx} className='text-xs'>
                                    <span className='inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 mr-1'>
                                      {activity.category}
                                    </span>
                                    <span className='font-medium'>{activity.name}</span>
                                    <span className='text-muted-foreground ml-1 text-[10px]'>
                                      ({activity.created_at})
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className='text-muted-foreground text-xs italic'>
                                Sin actividades pendientes
                              </span>
                            )}
                          </div>
                        </TableCell>
                            <TableCell>
                              <Textarea
                                value={student.insufficient_activities}
                                onChange={(e) => handleInputChange(student.id, 'insufficient_activities', e.target.value)}
                                className='min-h-[60px] text-xs resize-none'
                                placeholder='Actividades con nota baja...'
                              />
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={student.positive_notes}
                                onChange={(e) => handleInputChange(student.id, 'positive_notes', e.target.value)}
                                className='min-h-[60px] text-xs resize-none'
                                placeholder='Aspectos positivos...'
                              />
                            </TableCell>
                        <TableCell className='text-center'>
                          <Button
                            variant={student.behavioral_issues === 'Sí' ? 'default' : 'outline'}
                            size='sm'
                            className='w-16'
                            onClick={() => {
                              const newValue = student.behavioral_issues === 'Sí' ? 'No' : 'Sí'
                              handleInputChange(student.id, 'behavioral_issues', newValue)
                            }}
                          >
                            {student.behavioral_issues === 'Sí' ? 'Sí' : 'No'}
                          </Button>
                        </TableCell>
                        <TableCell className='text-center'>
                          <Button
                            variant={student.attendance_issues === 'Sí' ? 'default' : 'outline'}
                            size='sm'
                            className='w-16'
                            onClick={() => {
                              const newValue = student.attendance_issues === 'Sí' ? 'No' : 'Sí'
                              handleInputChange(student.id, 'attendance_issues', newValue)
                            }}
                          >
                            {student.attendance_issues === 'Sí' ? 'Sí' : 'No'}
                          </Button>
                        </TableCell>
                            <TableCell>
                              <Textarea
                                value={student.personal_presentation}
                                onChange={(e) => handleInputChange(student.id, 'personal_presentation', e.target.value)}
                                className='min-h-[60px] text-xs resize-none'
                                placeholder='Presentación personal...'
                              />
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={student.observations}
                                onChange={(e) => handleInputChange(student.id, 'observations', e.target.value)}
                                className='min-h-[60px] text-xs resize-none'
                                placeholder='Observaciones generales...'
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleSaveReport(student)}
                                disabled={isSaving}
                              >
                                <Save className='h-3 w-3' />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Vista de selección de materia y grados (como Planillas)
          <div className='space-y-6'>
            <div>
              <div className='flex items-center justify-between'>
                <div>
                  <h1 className='text-2xl font-bold tracking-tight'>
                    Informe Cualitativo
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
                  <BookOpen className='h-12 w-12 text-muted-foreground mb-4' />
                  <h3 className='text-lg font-semibold mb-2'>No tienes asignaciones</h3>
                  <p className='text-muted-foreground text-center mb-4'>
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
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger className='w-36'>
                        <SelectValue placeholder='Materia' />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.subjectId} value={subject.subjectId}>
                            {subject.subjectName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
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
                      className='rounded-lg border p-4 hover:shadow-md cursor-pointer transition-shadow'
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
                          <FileText className='h-4 w-4 mr-2' />
                          Informe
                        </Button>
                      </div>
                      <div>
                        <h2 className='mb-1 font-semibold'>{gradeApp.name}</h2>
                        <p className='line-clamp-2 text-gray-500'>{gradeApp.desc}</p>
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

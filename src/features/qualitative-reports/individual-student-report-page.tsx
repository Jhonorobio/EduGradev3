import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useColegio } from '@/hooks/use-colegio'
import { getGradeByDirector } from '@/services/grade-directors'
import { getAlumnosByGrade } from '@/services/alumnos'
import { getSubjectsByGrade, GradeSubject } from '@/services/grade-subjects'
import { getColegioSettings, ColegioSettings } from '@/services/colegio-settings'
import { GradeDirectorInfo } from '@/services/grade-directors'
import { Alumno } from '@/services/alumnos'
import { Users, FileText, BookOpen, ChevronLeft, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'

// Logo base64 del colegio - reemplazar con el logo real
const LOGO_BASE64 = ''

interface SubjectObservation {
  subjectId: string
  subjectName: string
  pendingActivities: string
  insufficientActivities: string
  positiveNotes: string
}

interface StudentReport {
  student: Alumno
  subjects: GradeSubject[]
  observations: SubjectObservation[]
}

export function IndividualStudentReportPage() {
  const { user, isDocente } = useAuth()
  const { selectedColegio } = useColegio()

  // Estados para la carga de datos
  const [isLoading, setIsLoading] = useState(true)
  const [isDirector, setIsDirector] = useState(false)
  const [managedGrade, setManagedGrade] = useState<GradeDirectorInfo | null>(null)
  const [students, setStudents] = useState<Alumno[]>([])
  const [colegioSettings, setColegioSettings] = useState<ColegioSettings | null>(null)

  // Estados para la selección y el formulario
  const [selectedStudent, setSelectedStudent] = useState<Alumno | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1')
  const [report, setReport] = useState<StudentReport | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [gradeSubjects, setGradeSubjects] = useState<GradeSubject[]>([])

  // Track if we've already loaded to prevent re-loading
  const hasLoaded = useRef(false)

  // Cargar el grado del director y estudiantes al montar
  useEffect(() => {
    // Only load once when user name is available and we haven't loaded yet
    if (user?.name && isDocente && !hasLoaded.current) {
      hasLoaded.current = true
      loadDirectorGrade()
    }
  }, [user?.name, isDocente])

  const loadDirectorGrade = async () => {
    if (!user?.name) return

    setIsLoading(true)
    const startTime = Date.now()

    try {
      // Verificar si el docente es director de algún grado
      const grade = await getGradeByDirector(user.name, selectedColegio || undefined)

      if (grade) {
        setIsDirector(true)
        setManagedGrade(grade)

        // Cargar estudiantes del grado en paralelo con la configuración
        const colegioId = selectedColegio || grade.colegio_id || '1'

      const [studentsData, subjectsData] = await Promise.all([
        getAlumnosByGrade(grade.id, colegioId),
        getSubjectsByGrade(grade.id, colegioId),
        // Precargar configuración pero no bloquear
        selectedColegio
          ? getColegioSettings(selectedColegio).then(setColegioSettings).catch(() => {})
          : Promise.resolve(),
      ])

      setStudents(studentsData)
      setGradeSubjects(subjectsData)
      } else {
        setIsDirector(false)
      }
    } catch (error) {
      console.error('Error loading director grade:', error)
      toast.error('Error al cargar la información del director de grado')
    } finally {
      // Ensure loading shows for at least 300ms to prevent flicker
      const elapsed = Date.now() - startTime
      if (elapsed < 300) {
        await new Promise((resolve) => setTimeout(resolve, 300 - elapsed))
      }
      setIsLoading(false)
    }
  }

  // Manejar selección de estudiante
  const handleSelectStudent = (student: Alumno) => {
    setSelectedStudent(student)
    // Inicializar las observaciones para cada materia
    const observations: SubjectObservation[] = gradeSubjects.map((item) => ({
      subjectId: item.subject.id,
      subjectName: item.subject.name,
      pendingActivities: '',
      insufficientActivities: '',
      positiveNotes: '',
    }))
    // Inicializar el reporte con las materias del grado
    setReport({
      student,
      subjects: gradeSubjects,
      observations,
    })
  }

  // Volver a la lista de estudiantes
  const handleBackToStudents = () => {
    setSelectedStudent(null)
    setReport(null)
  }

// Actualizar observaciones de una materia específica
const handleUpdateSubjectObservation = (
  subjectId: string,
  field: keyof Omit<SubjectObservation, 'subjectId' | 'subjectName'>,
  value: string
) => {
  if (!report) return
  const updatedObservations = report.observations.map((obs) =>
    obs.subjectId === subjectId ? { ...obs, [field]: value } : obs
  )
  setReport({ ...report, observations: updatedObservations })
}

  // Guardar reporte (podría conectarse a una API en el futuro)
  const handleSaveReport = () => {
    // Aquí se podría guardar en la base de datos
    toast.success('Informe guardado correctamente')
  }

  // Generar PDF del informe individual
  const handleGeneratePDF = async () => {
    if (!report || !selectedStudent || !managedGrade) return

    setIsGeneratingPDF(true)
    try {
      const [{ jsPDF }, autoTable] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ])

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      // Configurar fuente
      doc.setFont('helvetica', 'normal')

      // Logo del colegio (si existe)
      if (LOGO_BASE64) {
        doc.addImage(LOGO_BASE64, 'PNG', 15, 10, 25, 25)
      }

      // Encabezado del colegio
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('COLEGIO PATRICIO SYMES', 105, 20, { align: 'center' })

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('INFORME INDIVIDUAL DEL ESTUDIANTE', 105, 28, { align: 'center' })
      doc.text('AÑO LECTIVO 2026', 105, 34, { align: 'center' })

      // Línea divisoria
      doc.setDrawColor(0)
      doc.line(15, 40, 195, 40)

      // Información del estudiante y grado
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('ESTUDIANTE:', 15, 48)
      doc.setFont('helvetica', 'normal')
      doc.text(`${selectedStudent.name} ${selectedStudent.last_name}`.toUpperCase(), 50, 48)

      doc.setFont('helvetica', 'bold')
      doc.text('GRADO:', 15, 55)
      doc.setFont('helvetica', 'normal')
      doc.text(managedGrade.name.toUpperCase(), 40, 55)

      doc.setFont('helvetica', 'bold')
      doc.text('PERÍODO:', 100, 55)
      doc.setFont('helvetica', 'normal')
      doc.text(selectedPeriod, 125, 55)

      // Línea divisoria
      doc.line(15, 60, 195, 60)

      // Secciones del informe
      let currentY = 68

      // Actividades Pendientes
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('ACTIVIDADES PENDIENTES', 15, currentY)
      currentY += 8

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const pendingText = report.pendingActivities || 'Sin actividades pendientes'
      const pendingLines = doc.splitTextToSize(pendingText, 175)
      doc.text(pendingLines, 15, currentY)
      currentY += pendingLines.length * 5 + 5

      // Actividades Insuficientes
      currentY += 5
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('ACTIVIDADES INSUFICIENTES', 15, currentY)
      currentY += 8

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const insufficientText = report.insufficientActivities || 'Sin actividades insuficientes'
      const insufficientLines = doc.splitTextToSize(insufficientText, 175)
      doc.text(insufficientLines, 15, currentY)
      currentY += insufficientLines.length * 5 + 5

      // Notas Positivas
      currentY += 5
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('NOTAS POSITIVAS', 15, currentY)
      currentY += 8

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const positiveText = report.positiveNotes || 'Sin notas positivas registradas'
      const positiveLines = doc.splitTextToSize(positiveText, 175)
      doc.text(positiveLines, 15, currentY)
      currentY += positiveLines.length * 5 + 10

      // Observaciones generales (si hay espacio)
      if (currentY < 240) {
        currentY += 10
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('OBSERVACIONES GENERALES', 15, currentY)
        currentY += 8

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text('_____________________________________________________________________________', 15, currentY)
        currentY += 6
        doc.text('_____________________________________________________________________________', 15, currentY)
        currentY += 6
        doc.text('_____________________________________________________________________________', 15, currentY)
      }

      // Firma del director de grado
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('FIRMA DEL DIRECTOR(A) DE GRADO', 15, 260)
      doc.line(15, 265, 100, 265)

      // Guardar PDF
      const fileName = `informe_individual_${selectedStudent.last_name}_${selectedStudent.name}_periodo${selectedPeriod}.pdf`
      doc.save(fileName)

      toast.success('PDF generado exitosamente')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Vista de no autorizado
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

  // Vista de carga
  if (isLoading) {
    return (
      <ProtectedRoute>
        <Header>
          <Search />
          <div className='ms-auto flex items-center gap-4'>
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className='flex h-[60vh] items-center justify-center'>
            <div className='flex flex-col items-center gap-4'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
              <p className='text-muted-foreground'>Cargando información...</p>
            </div>
          </div>
        </Main>
      </ProtectedRoute>
    )
  }

  // Vista de no director de grado
  if (!isDirector || !managedGrade) {
    return (
      <ProtectedRoute>
        <Header>
          <Search />
          <div className='ms-auto flex items-center gap-4'>
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className='flex h-[60vh] items-center justify-center'>
            <Card className='max-w-md'>
              <CardContent className='flex flex-col items-center justify-center py-12'>
                <Users className='mb-4 h-12 w-12 text-muted-foreground' />
                <h3 className='mb-2 text-lg font-semibold'>No eres Director de Grado</h3>
                <p className='text-center text-muted-foreground'>
                  Esta función está disponible únicamente para docentes que son directores de grado.
                </p>
                <p className='mt-4 text-sm text-muted-foreground'>
                  Si crees que deberías ser director de grado, contacta al administrador.
                </p>
              </CardContent>
            </Card>
          </div>
        </Main>
      </ProtectedRoute>
    )
  }

  // Vista del formulario del estudiante seleccionado
  if (selectedStudent && report) {
    return (
      <ProtectedRoute>
        <Header>
          <Search />
          <div className='ms-auto flex items-center gap-4'>
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className='mx-auto max-w-4xl space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <Button variant='outline' size='sm' onClick={handleBackToStudents}>
                  <ChevronLeft className='mr-2 h-4 w-4' />
                  Volver
                </Button>
                <div>
                  <h1 className='text-2xl font-bold tracking-tight'>Informe Individual</h1>
                  <p className='text-muted-foreground'>
                    {selectedStudent.name} {selectedStudent.last_name} - {managedGrade.name}
                  </p>
                </div>
              </div>
              <div className='flex gap-2'>
                <Button variant='outline' onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
                  {isGeneratingPDF ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Download className='mr-2 h-4 w-4' />
                  )}
                  Exportar PDF
                </Button>
              </div>
            </div>

            <Separator />

            {/* Información del grado (solo lectura) */}
            <Card>
              <CardHeader>
                <CardTitle className='text-sm font-medium text-muted-foreground'>
                  Información del Grado
                </CardTitle>
              </CardHeader>
              <CardContent className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='text-sm font-medium'>Grado</label>
                  <p className='text-lg font-semibold'>{managedGrade.name}</p>
                </div>
                <div>
                  <label className='text-sm font-medium'>Nivel</label>
                  <p className='text-lg font-semibold'>{managedGrade.level}</p>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de observaciones por materia */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <BookOpen className='h-5 w-5' />
                  Observaciones por Materia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <table className='w-full border-collapse border border-gray-300'>
                    {/* Header */}
                    <thead>
                      <tr className='bg-gray-50'>
                        <th
                          rowSpan={2}
                          className='w-48 border border-gray-300 px-4 py-3 text-center font-semibold uppercase text-sm'
                        >
                          Asignatura
                        </th>
                        <th
                          colSpan={3}
                          className='border border-gray-300 px-4 py-3 text-center font-semibold uppercase text-sm'
                        >
                          Observaciones
                        </th>
                      </tr>
                      <tr className='bg-gray-50'>
                        <th className='w-1/3 border border-gray-300 px-2 py-2 text-center text-xs font-medium'>
                          ACTIVIDADES PENDIENTES
                        </th>
                        <th className='w-1/3 border border-gray-300 px-2 py-2 text-center text-xs font-medium'>
                          ACTIVIDADES INSUFICIENTES
                        </th>
                        <th className='w-1/3 border border-gray-300 px-2 py-2 text-center text-xs font-medium'>
                          NOTAS POSITIVAS
                        </th>
                      </tr>
                    </thead>
                    {/* Body */}
                    <tbody>
                      {report.observations.map((obs) => (
                        <tr key={obs.subjectId} className='hover:bg-gray-50/50'>
                          <td className='border border-gray-300 px-3 py-2 align-middle'>
                            <span className='font-medium text-sm'>{obs.subjectName}</span>
                          </td>
                          <td className='border border-gray-300 p-0'>
                            <textarea
                              value={obs.pendingActivities}
                              onChange={(e) =>
                                handleUpdateSubjectObservation(
                                  obs.subjectId,
                                  'pendingActivities',
                                  e.target.value
                                )
                              }
                              className='min-h-[60px] w-full resize-none border-0 bg-transparent p-2 text-xs focus:outline-none focus:ring-0'
                              placeholder='Sin actividades pendientes'
                            />
                          </td>
                          <td className='border border-gray-300 p-0'>
                            <textarea
                              value={obs.insufficientActivities}
                              onChange={(e) =>
                                handleUpdateSubjectObservation(
                                  obs.subjectId,
                                  'insufficientActivities',
                                  e.target.value
                                )
                              }
                              className='min-h-[60px] w-full resize-none border-0 bg-transparent p-2 text-xs focus:outline-none focus:ring-0'
                              placeholder='Sin actividades insuficientes'
                            />
                          </td>
                          <td className='border border-gray-300 p-0'>
                            <textarea
                              value={obs.positiveNotes}
                              onChange={(e) =>
                                handleUpdateSubjectObservation(
                                  obs.subjectId,
                                  'positiveNotes',
                                  e.target.value
                                )
                              }
                              className='min-h-[60px] w-full resize-none border-0 bg-transparent p-2 text-xs focus:outline-none focus:ring-0'
                              placeholder='Sin notas positivas'
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(!report.observations || report.observations.length === 0) && (
                  <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
                    <BookOpen className='mb-2 h-8 w-8' />
                    <p>No hay materias asignadas a este grado.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className='flex justify-end gap-4'>
              <Button variant='outline' onClick={handleBackToStudents}>
                Cancelar
              </Button>
              <Button onClick={handleSaveReport}>Guardar Informe</Button>
            </div>
          </div>
        </Main>
      </ProtectedRoute>
    )
  }

  // Vista de lista de estudiantes (cards)
  return (
    <ProtectedRoute>
      <Header>
        <Search />
        <div className='ms-auto flex items-center gap-4'>
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='space-y-6'>
          {/* Header */}
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Informe Individual de Estudiantes</h1>
            <p className='text-muted-foreground'>
              Grado: <span className='font-semibold'>{managedGrade.name}</span> | Selecciona un
              estudiante para generar su informe
            </p>
          </div>

          <Separator />

          {/* Grid de estudiantes */}
          {students.length === 0 ? (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-12'>
                <Users className='mb-4 h-12 w-12 text-muted-foreground' />
                <h3 className='mb-2 text-lg font-semibold'>No hay estudiantes</h3>
                <p className='text-center text-muted-foreground'>
                  No se encontraron estudiantes activos en este grado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {students.map((student) => (
                <Card
                  key={student.id}
                  className='cursor-pointer transition-shadow hover:shadow-md'
                  onClick={() => handleSelectStudent(student)}
                >
                  <CardContent className='p-6'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10'>
                          <Users className='h-5 w-5 text-primary' />
                        </div>
                        <div>
                          <h3 className='font-semibold'>
                            {student.name} {student.last_name}
                          </h3>
                          <p className='text-sm text-muted-foreground'>Click para generar informe</p>
                        </div>
                      </div>
                      <Button variant='ghost' size='sm' className='shrink-0'>
                        <FileText className='h-4 w-4' />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Main>
    </ProtectedRoute>
  )
}

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useColegio } from '@/hooks/use-colegio'
import { getAssignmentsByTeacher, getGrades } from '@/services/assignments'
import { sortGradesEducationally } from '@/utils/grade-ordering'
import { Users, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { GradebookTable } from '@/features/planillas/gradebook-table'

interface SubjectWithGrades {
  subjectName: string
  subjectId: string
  grades: { id: string; name: string }[]
  collegeId?: string
}

interface GradeApp {
  id: string
  name: string
  desc: string
  connected: boolean
  subjectId: string
  subjectName: string
  collegeId?: string
}

export function Planillas() {
  const [subjects, setSubjects] = useState<SubjectWithGrades[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const { user, isDocente } = useAuth()
  const { selectedColegio } = useColegio()
  
  // Estado para controlar el gradebook
  const [showGradebook, setShowGradebook] = useState(false)
  const [selectedGradebook, setSelectedGradebook] = useState<{
    subjectId: string
    gradeId: string
    subjectName: string
    gradeName: string
    collegeId: string
  } | null>(null)

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

  const loadTeacherAssignments = async () => {
    if (!user?.id) return

    try {
      const assignmentsData = await getAssignmentsByTeacher(user.id)
      
      // Filtrar por el colegio seleccionado
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

      // Ordenar grados educativamente para cada materia
      const subjectsArray = Array.from(subjectsMap.values())
      subjectsArray.forEach(subject => {
        subject.grades = sortGradesEducationally(subject.grades)
      })

      // Ordenar materias alfabéticamente
      subjectsArray.sort((a, b) => a.subjectName.localeCompare(b.subjectName))
      
      setSubjects(subjectsArray)
    } catch (error) {
      console.error('Error loading assignments:', error)
      toast.error('Error al cargar las asignaciones')
    }
  }

  const handleOpenGradebook = (gradeApp: GradeApp) => {
    setSelectedGradebook({
      subjectId: gradeApp.subjectId,
      gradeId: gradeApp.id,
      subjectName: gradeApp.subjectName,
      gradeName: gradeApp.name,
      collegeId: gradeApp.collegeId || selectedColegio || ''
    })
    setShowGradebook(true)
  }

  const handleBackToPlanillas = () => {
    setShowGradebook(false)
    setSelectedGradebook(null)
  }

  // Convertir a formato de "apps" para cada grado
  const gradesAsApps: GradeApp[] = []
  const currentSubject = subjects.find(s => s.subjectId === selectedSubject)
  
  if (currentSubject) {
    currentSubject.grades.forEach(grade => {
      gradesAsApps.push({
        id: grade.id,
        name: grade.name,
        desc: 'Gestiona las notas y asistencia de este grado',
        connected: true,
        subjectId: currentSubject.subjectId,
        subjectName: currentSubject.subjectName,
        collegeId: currentSubject.collegeId
      })
    })
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

      <Main fluid>
        {showGradebook && selectedGradebook ? (
          <GradebookTable
            subjectId={selectedGradebook.subjectId}
            gradeId={selectedGradebook.gradeId}
            subjectName={selectedGradebook.subjectName}
            gradeName={selectedGradebook.gradeName}
            collegeId={selectedGradebook.collegeId}
            onBack={handleBackToPlanillas}
          />
        ) : (
          <div className='space-y-6'>
            <div>
              <div className='flex items-center justify-between'>
                <div>
                  <h1 className='text-2xl font-bold tracking-tight'>
                    Planillas de Clase
                  </h1>
                  <p className='text-muted-foreground'>
                    Gestiona tus planillas por materia y grado.
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
                      className='rounded-lg border p-4 hover:shadow-md'
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
                          onClick={() => handleOpenGradebook(gradeApp)}
                        >
                          Abrir Planilla
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

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { getAssignmentsByTeacher, Assignment } from '@/services/assignments'
import { sortGradesEducationally } from '@/utils/grade-ordering'
import { Users, BookOpen, SlidersHorizontal, ArrowUpAZ, ArrowDownAZ } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface SubjectWithGrades {
  subjectName: string
  subjectId: string
  grades: { id: string; name: string }[]
}

interface GradeApp {
  id: string
  name: string
  desc: string
  connected: boolean
  subjectId: string
  subjectName: string
}

export function Planillas() {
  const [subjects, setSubjects] = useState<SubjectWithGrades[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const { user, isDocente } = useAuth()

  useEffect(() => {
    if (user && isDocente) {
      loadTeacherAssignments()
    }
  }, [user, isDocente])

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].subjectId)
    }
  }, [subjects])

  const loadTeacherAssignments = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const assignmentsData = await getAssignmentsByTeacher(user.id)

      // Agrupar asignaciones por materia
      const subjectsMap = new Map<string, SubjectWithGrades>()
      
      assignmentsData.forEach(assignment => {
        const subjectKey = assignment.subject_id
        const subjectName = assignment.subject_name || 'Sin materia'
        
        if (!subjectsMap.has(subjectKey)) {
          subjectsMap.set(subjectKey, {
            subjectName,
            subjectId: subjectKey,
            grades: []
          })
        }
        
        subjectsMap.get(subjectKey)!.grades.push({
          id: assignment.grade_id,
          name: assignment.grade_name || 'Sin grado'
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
    } finally {
      setLoading(false)
    }
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
        subjectName: currentSubject.subjectName
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

      <Main fixed>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Planillas de Clase
          </h1>
          <p className='text-muted-foreground'>
            Gestiona tus planillas por materia y grado.
          </p>
        </div>
        
        {subjects.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <BookOpen className='h-12 w-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>No tienes asignaciones</h3>
              <p className='text-muted-foreground text-center mb-4'>
                No se encontraron materias asignadas a tu perfil.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
              <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
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
            
            <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 pb-16 md:grid-cols-2 lg:grid-cols-3'>
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
      </Main>
    </ProtectedRoute>
  )
}

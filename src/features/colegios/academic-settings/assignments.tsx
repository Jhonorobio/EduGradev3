import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Plus, Edit, Trash2, ArrowLeft, User, BookOpen, GraduationCap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { AssignmentsSkeleton } from '@/features/academic-settings/components/academic-skeletons'
import { AssignmentDialog } from '@/features/academic-settings/components/assignment-dialog'
import { DeleteConfirmDialog } from '@/features/academic-settings/components/delete-confirm-dialog'
import { getAssignments, createAssignment, updateAssignment, deleteAssignment, Assignment } from '@/services/assignments'
import { getSubjectsByColegio } from '@/services/subjects'
import { getGradesByColegio } from '@/services/grades'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'

const route = getRouteApi('/_authenticated/gestion/colegios/$colegioId/academic-settings/assignments/')

export function ColegioAssignments() {
  const { colegioId } = route.useParams()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [colegioId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [assignmentsData, subjectsData, gradesData] = await Promise.all([
        getAssignments(colegioId),
        getSubjectsByColegio(colegioId),
        getGradesByColegio(colegioId)
      ])
      setAssignments(assignmentsData)
      setSubjects(subjectsData)
      setGrades(gradesData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssignment = async (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at' | 'teacher_name' | 'subject_name' | 'grade_name'>) => {
    try {
      setSaving(true)
      const newAssignment = await createAssignment({
        ...assignmentData,
        colegio_id: colegioId
      })
      setAssignments([...assignments, newAssignment])
      setDialogOpen(false)
      toast.success('Asignación creada exitosamente')
    } catch (error) {
      console.error('Error creating assignment:', error)
      toast.error('Error al crear la asignación')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateAssignment = async (assignmentData: Omit<Assignment, 'created_at' | 'updated_at' | 'teacher_name' | 'subject_name' | 'grade_name'>) => {
    try {
      setSaving(true)
      const updatedAssignment = await updateAssignment(assignmentData.id, assignmentData)
      setAssignments(assignments.map(a => a.id === assignmentData.id ? updatedAssignment : a))
      setDialogOpen(false)
      setSelectedAssignment(null)
      toast.success('Asignación actualizada exitosamente')
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast.error('Error al actualizar la asignación')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      setDeleting(true)
      await deleteAssignment(assignmentId)
      setAssignments(assignments.filter(a => a.id !== assignmentId))
      setDeleteDialogOpen(false)
      setSelectedAssignment(null)
      toast.success('Asignación eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error('Error al eliminar la asignación')
    } finally {
      setDeleting(false)
    }
  }

  const openCreateDialog = () => {
    setSelectedAssignment(null)
    setDialogOpen(true)
  }

  const openEditDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setDialogOpen(true)
  }

  const openDeleteDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return <AssignmentsSkeleton />
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Link to={`/gestion/colegios/${colegioId}/academic-settings`}>
              <Button variant='outline' size='sm'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Volver
              </Button>
            </Link>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>Asignaciones</h2>
              <p className='text-muted-foreground'>
                Gestiona las asignaciones del colegio.
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className='h-4 w-4 mr-2' />
            Agregar Asignación
          </Button>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {assignments.map((assignment) => (
            <Card key={assignment.id} className='hover:shadow-md transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Asignación</CardTitle>
                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm' onClick={() => openEditDialog(assignment)}>
                    <Edit className='h-4 w-4' />
                  </Button>
                  <Button variant='outline' size='sm' onClick={() => openDeleteDialog(assignment)}>
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <User className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm'>{assignment.teacher_name || 'Sin docente'}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <BookOpen className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm'>{assignment.subject_name || 'Sin materia'}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <GraduationCap className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm'>{assignment.grade_name || 'Sin grado'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <AssignmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          assignment={selectedAssignment}
          subjects={subjects}
          grades={grades}
          onSave={selectedAssignment ? handleUpdateAssignment : handleCreateAssignment}
          saving={saving}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title='Eliminar Asignación'
          description={`¿Estás seguro de que deseas eliminar esta asignación? Esta acción no se puede deshacer.`}
          onConfirm={() => selectedAssignment && handleDeleteAssignment(selectedAssignment.id)}
          deleting={deleting}
        />
      </Main>
    </>
  )
}

import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { SubjectsSkeleton } from '@/features/academic-settings/components/academic-skeletons'
import { SubjectDialog } from '@/features/academic-settings/components/subject-dialog'
import { DeleteConfirmDialog } from '@/features/academic-settings/components/delete-confirm-dialog'
import { getSubjectsByColegio, createSubject, updateSubject, deleteSubject, Subject } from '@/services/subjects'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'

const route = getRouteApi('/_authenticated/gestion/colegios/$colegioId/academic-settings/subjects')

export function ColegioSubjects() {
  const { colegioId } = route.useParams()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadSubjects()
  }, [colegioId])

  const loadSubjects = async () => {
    try {
      setLoading(true)
      const data = await getSubjectsByColegio(colegioId)
      setSubjects(data)
    } catch (error) {
      console.error('Error loading subjects:', error)
      toast.error('Error al cargar las materias')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubject = async (subjectData: Omit<Subject, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setSaving(true)
      const newSubject = await createSubject({
        ...subjectData,
        colegio_id: colegioId
      })
      setSubjects([...subjects, newSubject])
      setDialogOpen(false)
      toast.success('Materia creada exitosamente')
    } catch (error) {
      console.error('Error creating subject:', error)
      toast.error('Error al crear la materia')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSubject = async (subjectData: Omit<Subject, 'created_at' | 'updated_at'>) => {
    try {
      setSaving(true)
      const updatedSubject = await updateSubject(subjectData.id, subjectData)
      setSubjects(subjects.map(s => s.id === subjectData.id ? updatedSubject : s))
      setDialogOpen(false)
      setSelectedSubject(null)
      toast.success('Materia actualizada exitosamente')
    } catch (error) {
      console.error('Error updating subject:', error)
      toast.error('Error al actualizar la materia')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      setDeleting(true)
      await deleteSubject(subjectId)
      setSubjects(subjects.filter(s => s.id !== subjectId))
      setDeleteDialogOpen(false)
      setSelectedSubject(null)
      toast.success('Materia eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting subject:', error)
      toast.error('Error al eliminar la materia')
    } finally {
      setDeleting(false)
    }
  }

  const openCreateDialog = () => {
    setSelectedSubject(null)
    setDialogOpen(true)
  }

  const openEditDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setDialogOpen(true)
  }

  const openDeleteDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return <SubjectsSkeleton />
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
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
              <h2 className='text-2xl font-bold tracking-tight'>Materias</h2>
              <p className='text-muted-foreground'>
                Gestiona las materias del colegio.
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className='h-4 w-4 mr-2' />
            Agregar Materia
          </Button>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {subjects.map((subject) => (
            <Card key={subject.id} className='hover:shadow-md transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>{subject.name}</CardTitle>
                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm' onClick={() => openEditDialog(subject)}>
                    <Edit className='h-4 w-4' />
                  </Button>
                  <Button variant='outline' size='sm' onClick={() => openDeleteDialog(subject)}>
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{subject.code}</CardDescription>
                <div className='mt-2'>
                  <Badge variant='secondary'>
                    {subject.levels.join(', ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <SubjectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          subject={selectedSubject}
          onSave={selectedSubject ? handleUpdateSubject : handleCreateSubject}
          saving={saving}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title='Eliminar Materia'
          description={`¿Estás seguro de que deseas eliminar la materia "${selectedSubject?.name}"? Esta acción no se puede deshacer.`}
          onConfirm={() => selectedSubject && handleDeleteSubject(selectedSubject.id)}
          deleting={deleting}
        />
      </Main>
    </>
  )
}

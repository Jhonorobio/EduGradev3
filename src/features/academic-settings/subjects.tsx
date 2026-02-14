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
import { BookOpen, Plus, Edit, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { SubjectsSkeleton } from './components/academic-skeletons'
import { SubjectDialog } from './components/subject-dialog'
import { DeleteConfirmDialog } from './components/delete-confirm-dialog'
import { getSubjects, createSubject, updateSubject, deleteSubject, Subject } from '@/services/subjects'
import { toast } from 'sonner'

const route = getRouteApi('/_authenticated/academic-settings/subjects/')

export function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    try {
      setLoading(true)
      const data = await getSubjects()
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
      const newSubject = await createSubject(subjectData)
      setSubjects(prev => [...prev, newSubject])
      setDialogOpen(false)
      toast.success('Materia creada exitosamente')
    } catch (error) {
      console.error('Error creating subject:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear la materia')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSubject = async (id: string, subjectData: Partial<Subject>) => {
    try {
      setSaving(true)
      const updatedSubject = await updateSubject(id, subjectData)
      setSubjects(prev => prev.map(s => s.id === id ? updatedSubject : s))
      setDialogOpen(false)
      setSelectedSubject(null)
      toast.success('Materia actualizada exitosamente')
    } catch (error) {
      console.error('Error updating subject:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la materia')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return

    try {
      setDeleting(true)
      await deleteSubject(selectedSubject.id)
      setSubjects(prev => prev.filter(s => s.id !== selectedSubject.id))
      setDeleteDialogOpen(false)
      setSelectedSubject(null)
      toast.success('Materia eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting subject:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la materia')
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
        <Main>
          <SubjectsSkeleton />
        </Main>
      </>
    )
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
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Materias</h2>
            <p className='text-muted-foreground'>
              Administra las materias del sistema educativo.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className='mr-2 h-4 w-4' />
            Nueva Materia
          </Button>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {subjects.map((subject) => (
            <Card key={subject.id} className='hover:shadow-md transition-shadow'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <BookOpen className='h-5 w-5' />
                    {subject.name}
                  </CardTitle>
                  <Badge variant='outline'>{subject.code}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='flex flex-wrap gap-1'>
                    <span className='text-sm text-muted-foreground'>Niveles:</span>
                    {(subject.levels || []).map((level) => (
                      <Badge key={level} variant='secondary' className='text-xs'>
                        {level}
                      </Badge>
                    ))}
                  </div>
                  <div className='flex gap-2 pt-2'>
                    <Button 
                      variant='outline' 
                      size='sm'
                      onClick={() => openEditDialog(subject)}
                    >
                      <Edit className='mr-2 h-4 w-4' />
                      Editar
                    </Button>
                    <Button 
                      variant='outline' 
                      size='sm'
                      onClick={() => openDeleteDialog(subject)}
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {subjects.length === 0 && (
          <div className='text-center py-12'>
            <BookOpen className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
            <h3 className='text-lg font-semibold mb-2'>No hay materias registradas</h3>
            <p className='text-muted-foreground mb-4'>
              Comienza creando tu primera materia.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className='mr-2 h-4 w-4' />
              Nueva Materia
            </Button>
          </div>
        )}
      </Main>

      <SubjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subject={selectedSubject}
        onSave={handleCreateSubject}
        onUpdate={handleUpdateSubject}
        loading={saving}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteSubject}
        itemName={selectedSubject?.name}
        loading={deleting}
      />
    </>
  )
}

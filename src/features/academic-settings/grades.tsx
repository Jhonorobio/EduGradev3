import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, Plus, Edit, Trash2, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import { GradesSkeleton } from './components/academic-skeletons'
import { GradeDialog } from './components/grade-dialog'
import { DeleteConfirmDialog } from './components/delete-confirm-dialog'
import { getGrades, createGrade, updateGrade, deleteGrade, Grade } from '@/services/grades'
import { toast } from 'sonner'

export function Grades() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadGrades()
  }, [])

  const loadGrades = async () => {
    try {
      setLoading(true)
      const data = await getGrades()
      setGrades(data)
    } catch (error) {
      console.error('Error loading grades:', error)
      toast.error('Error al cargar los grados')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGrade = async (gradeData: Omit<Grade, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setSaving(true)
      const newGrade = await createGrade(gradeData)
      setGrades(prev => [...prev, newGrade])
      setDialogOpen(false)
      toast.success('Grado creado exitosamente')
    } catch (error) {
      console.error('Error creating grade:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear el grado')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateGrade = async (id: string, gradeData: Partial<Grade>) => {
    try {
      setSaving(true)
      const updatedGrade = await updateGrade(id, gradeData)
      setGrades(prev => prev.map(g => g.id === id ? updatedGrade : g))
      setDialogOpen(false)
      setSelectedGrade(null)
      toast.success('Grado actualizado exitosamente')
    } catch (error) {
      console.error('Error updating grade:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el grado')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGrade = async () => {
    if (!selectedGrade) return

    try {
      setDeleting(true)
      await deleteGrade(selectedGrade.id)
      setGrades(prev => prev.filter(g => g.id !== selectedGrade.id))
      setDeleteDialogOpen(false)
      setSelectedGrade(null)
      toast.success('Grado eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting grade:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el grado')
    } finally {
      setDeleting(false)
    }
  }

  const openCreateDialog = () => {
    setSelectedGrade(null)
    setDialogOpen(true)
  }

  const openEditDialog = (grade: Grade) => {
    setSelectedGrade(grade)
    setDialogOpen(true)
  }

  const openDeleteDialog = (grade: Grade) => {
    setSelectedGrade(grade)
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
          <GradesSkeleton />
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
            <h2 className='text-2xl font-bold tracking-tight'>Grados</h2>
            <p className='text-muted-foreground'>
              Gestiona los grados y niveles educativos.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className='mr-2 h-4 w-4' />
            Nuevo Grado
          </Button>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {grades.map((grade) => (
            <Card key={grade.id} className='hover:shadow-md transition-shadow'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <GraduationCap className='h-5 w-5' />
                    {grade.name}
                  </CardTitle>
                  <Badge variant='secondary'>{grade.level}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Director de Grupo:</span>
                    <span className='font-medium'>
                      {grade.groupDirector || 'Sin director asignado'}
                    </span>
                  </div>
                  <div className='flex gap-2 pt-2'>
                    <Button 
                      variant='outline' 
                      size='sm'
                      onClick={() => openEditDialog(grade)}
                    >
                      <Edit className='mr-2 h-4 w-4' />
                      Editar
                    </Button>
                    <Button 
                      variant='outline' 
                      size='sm'
                      onClick={() => openDeleteDialog(grade)}
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

        {grades.length === 0 && (
          <div className='text-center py-12'>
            <GraduationCap className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
            <h3 className='text-lg font-semibold mb-2'>No hay grados registrados</h3>
            <p className='text-muted-foreground mb-4'>
              Comienza creando tu primer grado.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className='mr-2 h-4 w-4' />
              Nuevo Grado
            </Button>
          </div>
        )}
      </Main>

      <GradeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        grade={selectedGrade}
        onSave={handleCreateGrade}
        onUpdate={handleUpdateGrade}
        loading={saving}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteGrade}
        itemName={selectedGrade?.name}
        loading={deleting}
      />
    </>
  )
}

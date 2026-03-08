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
import { GraduationCap, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { GradesSkeleton } from '@/features/academic-settings/components/academic-skeletons'
import { GradeDialog } from '@/features/academic-settings/components/grade-dialog'
import { DeleteConfirmDialog } from '@/features/academic-settings/components/delete-confirm-dialog'
import { getGradesByColegio, createGrade, updateGrade, deleteGrade, Grade } from '@/services/grades'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'

const route = getRouteApi('/_authenticated/gestion/colegios/$colegioId/academic-settings/grades/')

export function ColegioGrades() {
  const { colegioId } = route.useParams()
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadGrades()
  }, [colegioId])

  const loadGrades = async () => {
    try {
      setLoading(true)
      const data = await getGradesByColegio(colegioId)
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
      const newGrade = await createGrade({
        ...gradeData,
        colegio_id: colegioId
      })
      setGrades([...grades, newGrade])
      setDialogOpen(false)
      toast.success('Grado creado exitosamente')
    } catch (error) {
      console.error('Error creating grade:', error)
      toast.error('Error al crear el grado')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateGrade = async (gradeData: Omit<Grade, 'created_at' | 'updated_at'>) => {
    try {
      setSaving(true)
      const updatedGrade = await updateGrade(gradeData.id, gradeData)
      setGrades(grades.map(g => g.id === gradeData.id ? updatedGrade : g))
      setDialogOpen(false)
      setSelectedGrade(null)
      toast.success('Grado actualizado exitosamente')
    } catch (error) {
      console.error('Error updating grade:', error)
      toast.error('Error al actualizar el grado')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGrade = async (gradeId: string) => {
    try {
      setDeleting(true)
      await deleteGrade(gradeId)
      setGrades(grades.filter(g => g.id !== gradeId))
      setDeleteDialogOpen(false)
      setSelectedGrade(null)
      toast.success('Grado eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting grade:', error)
      toast.error('Error al eliminar el grado')
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
    return <GradesSkeleton />
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
              <h2 className='text-2xl font-bold tracking-tight'>Grados</h2>
              <p className='text-muted-foreground'>
                Gestiona los grados del colegio.
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className='h-4 w-4 mr-2' />
            Agregar Grado
          </Button>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {grades.map((grade) => (
            <Card key={grade.id} className='hover:shadow-md transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>{grade.name}</CardTitle>
                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm' onClick={() => openEditDialog(grade)}>
                    <Edit className='h-4 w-4' />
                  </Button>
                  <Button variant='outline' size='sm' onClick={() => openDeleteDialog(grade)}>
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{grade.level}</CardDescription>
                {grade.group_director && (
                  <div className='mt-2'>
                    <Badge variant='secondary'>
                      Director: {grade.group_director}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <GradeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          grade={selectedGrade}
          onSave={selectedGrade ? handleUpdateGrade : handleCreateGrade}
          saving={saving}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title='Eliminar Grado'
          description={`¿Estás seguro de que deseas eliminar el grado "${selectedGrade?.name}"? Esta acción no se puede deshacer.`}
          onConfirm={() => selectedGrade && handleDeleteGrade(selectedGrade.id)}
          deleting={deleting}
        />
      </Main>
    </>
  )
}

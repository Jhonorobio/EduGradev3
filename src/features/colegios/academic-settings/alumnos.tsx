import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, UserPlus, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Trash2, Upload } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getAlumnosByColegio, createAlumno, updateAlumno, deleteAlumno, Alumno } from '@/services/alumnos'
import { getGradesByColegio } from '@/services/grades'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const route = getRouteApi('/_authenticated/gestion/colegios/$colegioId/academic-settings/alumnos')

const statusConfig = {
  active: { label: 'Activo', variant: 'default' as const },
  inactive: { label: 'Inactivo', variant: 'secondary' as const },
  suspended: { label: 'Suspendido', variant: 'destructive' as const },
}

type SortField = 'name' | 'grade_name' | 'status'
type SortDirection = 'asc' | 'desc'

export function ColegioAlumnos() {
  const { colegioId } = route.useParams()
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [csvData, setCsvData] = useState<any[]>([])
  const itemsPerPage = 10
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    grade_id: '',
    status: 'active' as 'active' | 'inactive' | 'suspended'
  })

  useEffect(() => {
    loadData()
  }, [colegioId])

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split(/\r?\n/)
          if (lines.length === 0) return resolve([])

          // Detectar separador (coma, punto y coma o tabulación)
          const firstLine = lines[0]
          let separator = ','
          if (firstLine.includes('\t')) separator = '\t'
          else if (firstLine.includes(';')) separator = ';'
          
          const headers = firstLine.split(separator).map(h => h.trim().toUpperCase())
          
          const data: any[] = []
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue
            const values = lines[i].split(separator)
            const row: any = {}
            headers.forEach((header, index) => {
              row[header] = values[index]?.trim() || ''
            })
            data.push(row)
          }
          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await parseCSV(file)
      console.log('CSV Data parsed:', data[0]) // Debug para ver las cabeceras reales
      setCsvData(data)
    } catch (error) {
      console.error('Error parsing CSV:', error)
      toast.error('Error al leer el archivo CSV')
    }
  }

  const handleImport = async () => {
    if (csvData.length === 0) return

    try {
      setImporting(true)
      
      let imported = 0
      let errors = 0
      let skipped = 0

      // Mapeo de números a nombres de grados (con tildes correctas)
      const gradeMapping: Record<string, string> = {
        '1': 'primero',
        '2': 'segundo',
        '3': 'tercero',
        '4': 'cuarto',
        '5': 'quinto',
        '6': 'sexto',
        '7': 'séptimo',
        '8': 'octavo',
        '9': 'noveno',
        '10': 'décimo',
        '11': 'once'
      }

      for (const row of csvData) {
        // Nombres exactos basados en la imagen
        const nombre1 = row['NOMBRE 1'] || row['NOMBRE1'] || ''
        const nombre2 = row['NOMBRE 2'] || row['NOMBRE2'] || ''
        const apellido1 = row['APELLIDO 1'] || row['APELLIDO1'] || ''
        const apellido2 = row['APELLIDO 2'] || row['APELLIDO2'] || ''
        const grupo = row['GRUPO/CURSO'] || row['GRADO'] || row['GRUPO'] || ''

        const name = [nombre1, nombre2].filter(n => n).join(' ')
        const lastName = [apellido1, apellido2].filter(a => a).join(' ')

        if (!name.trim() || !lastName.trim()) {
          errors++
          continue
        }

        // Verificar si el alumno ya existe (por nombre completo)
        const exists = alumnos.some(a => 
          a.name.toLowerCase() === name.toLowerCase() && 
          a.last_name.toLowerCase() === lastName.toLowerCase()
        )

        if (exists) {
          skipped++
          continue
        }

        // Buscar grado por nombre (Ignorando tildes y mayúsculas)
        const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        const normalizedGrupo = normalize(grupo)
        
        const grade = grades.find(g => {
          const normalizedGradeName = normalize(g.name)
          // Caso 1: Coincidencia exacta o parcial
          if (normalizedGradeName === normalizedGrupo || normalizedGrupo.includes(normalizedGradeName)) return true
          // Caso 2: El grupo es un número y coincide con el mapeo (ej: "1" -> "primero")
          if (gradeMapping[grupo.trim()] === normalizedGradeName) return true
          return false
        })

        if (!grade) {
          console.warn(`No se encontró el grado para: ${grupo}`)
          errors++
          continue
        }

        await createAlumno({
          name,
          last_name: lastName,
          grade_id: grade.id,
          status: 'active',
          colegio_id: colegioId,
          grade_name: '',
          colegio_name: ''
        })
        imported++
      }

      await loadData()
      setImportDialogOpen(false)
      setCsvData([])
      
      let message = `${imported} alumnos importados.`
      if (skipped > 0) message += ` ${skipped} ya existían.`
      if (errors > 0) message += ` ${errors} errores.`
      
      toast.success(message)
    } catch (error) {
      console.error('Error importing:', error)
      toast.error('Error al importar alumnos')
    } finally {
      setImporting(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [alumnosData, gradesData] = await Promise.all([
        getAlumnosByColegio(colegioId),
        getGradesByColegio(colegioId)
      ])
      setAlumnos(alumnosData)
      setGrades(gradesData)
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const filteredAlumnos = alumnos.filter(alumno => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = 
      alumno.name.toLowerCase().includes(search) ||
      alumno.last_name.toLowerCase().includes(search) ||
      (alumno.grade_name || '').toLowerCase().includes(search)
    
    const matchesStatus = filterStatus === 'all' || alumno.status === filterStatus
    const matchesGrade = filterGrade === 'all' || alumno.grade_id === filterGrade
    
    return matchesSearch && matchesStatus && matchesGrade
  })

  const sortedAlumnos = [...filteredAlumnos].sort((a, b) => {
    let aVal: string = ''
    let bVal: string = ''
    
    if (sortField === 'name') {
      aVal = `${a.name} ${a.last_name}`.toLowerCase()
      bVal = `${b.name} ${b.last_name}`.toLowerCase()
    } else if (sortField === 'grade_name') {
      aVal = (a.grade_name || '').toLowerCase()
      bVal = (b.grade_name || '').toLowerCase()
    } else if (sortField === 'status') {
      aVal = a.status
      bVal = b.status
    }
    
    if (sortDirection === 'asc') {
      return aVal.localeCompare(bVal)
    } else {
      return bVal.localeCompare(aVal)
    }
  })

  const totalPages = Math.ceil(sortedAlumnos.length / itemsPerPage)
  const paginatedAlumnos = sortedAlumnos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className='ml-1 h-3 w-3 opacity-50' />
    return sortDirection === 'asc' ? <ArrowUp className='ml-1 h-3 w-3' /> : <ArrowDown className='ml-1 h-3 w-3' />
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedAlumnos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedAlumnos.map(a => a.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      
      if (selectedAlumno) {
        await deleteAlumno(selectedAlumno.id)
        setAlumnos(alumnos.filter(a => a.id !== selectedAlumno.id))
        toast.success('Alumno eliminado')
      } else if (selectedIds.size > 0) {
        for (const id of selectedIds) {
          await deleteAlumno(id)
        }
        setAlumnos(alumnos.filter(a => !selectedIds.has(a.id)))
        setSelectedIds(new Set())
        toast.success(`${selectedIds.size} alumnos eliminados`)
      }
      
      setDeleteDialogOpen(false)
      setSelectedAlumno(null)
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const handleCreateAlumno = async () => {
    if (!formData.name.trim() || !formData.last_name.trim() || !formData.grade_id) {
      toast.error('Por favor completa todos los campos')
      return
    }

    try {
      setSaving(true)
      const newAlumno = await createAlumno({
        name: formData.name,
        last_name: formData.last_name,
        grade_id: formData.grade_id,
        status: formData.status,
        colegio_id: colegioId,
        grade_name: '',
        colegio_name: ''
      })
      setAlumnos([...alumnos, newAlumno])
      setDialogOpen(false)
      resetForm()
      toast.success('Alumno creado exitosamente')
    } catch (error) {
      console.error('Error creating alumno:', error)
      toast.error('Error al crear el alumno')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateAlumno = async () => {
    if (!selectedAlumno || !formData.name.trim() || !formData.last_name.trim() || !formData.grade_id) {
      toast.error('Por favor completa todos los campos')
      return
    }

    try {
      setSaving(true)
      const updatedAlumno = await updateAlumno(selectedAlumno.id, {
        name: formData.name,
        last_name: formData.last_name,
        grade_id: formData.grade_id,
        status: formData.status
      })
      setAlumnos(alumnos.map(a => a.id === selectedAlumno.id ? updatedAlumno : a))
      setDialogOpen(false)
      setSelectedAlumno(null)
      resetForm()
      toast.success('Alumno actualizado exitosamente')
    } catch (error) {
      console.error('Error updating alumno:', error)
      toast.error('Error al actualizar el alumno')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      last_name: '',
      grade_id: '',
      status: 'active'
    })
  }

  const openCreateDialog = () => {
    setSelectedAlumno(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (alumno: Alumno) => {
    setSelectedAlumno(alumno)
    setFormData({
      name: alumno.name,
      last_name: alumno.last_name,
      grade_id: alumno.grade_id,
      status: alumno.status
    })
    setDialogOpen(true)
  }

  const openDeleteDialog = (alumno?: Alumno) => {
    if (alumno) {
      setSelectedAlumno(alumno)
    } else {
      setSelectedAlumno(null)
    }
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
        <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
          <div className='flex items-center justify-center min-h-96'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4' />
              <p className='text-muted-foreground'>Cargando alumnos...</p>
            </div>
          </div>
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
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Link to={`/gestion/colegios/${colegioId}/academic-settings`}>
              <Button variant='outline' size='sm'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Volver
              </Button>
            </Link>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>Alumnos</h2>
              <p className='text-muted-foreground'>
                Gestiona los alumnos del colegio.
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <UserPlus className='h-4 w-4 mr-2' />
            Agregar Alumno
          </Button>
          <Button variant='outline' onClick={() => setImportDialogOpen(true)}>
            <Upload className='h-4 w-4 mr-2' />
            Importar CSV
          </Button>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Input
            placeholder='Buscar alumno...'
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className='max-w-sm'
          />
          
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1) }}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Estado' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos los estados</SelectItem>
              <SelectItem value='active'>Activo</SelectItem>
              <SelectItem value='inactive'>Inactivo</SelectItem>
              <SelectItem value='suspended'>Suspendido</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterGrade} onValueChange={(v) => { setFilterGrade(v); setCurrentPage(1) }}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Grado' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos los grados</SelectItem>
              {grades.map((grade) => (
                <SelectItem key={grade.id} value={grade.id}>
                  {grade.name} ({grade.level})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedIds.size > 0 && (
            <Button variant='destructive' size='sm' onClick={() => openDeleteDialog()}>
              <Trash2 className='h-4 w-4 mr-2' />
              Eliminar ({selectedIds.size})
            </Button>
          )}

          <Badge variant='outline'>
            {filteredAlumnos.length} alumno(s)
          </Badge>
        </div>

        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12'>
                  <Checkbox
                    checked={selectedIds.size === paginatedAlumnos.length && paginatedAlumnos.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className='cursor-pointer' onClick={() => handleSort('name')}>
                  <div className='flex items-center'>
                    Nombre
                    <SortIcon field='name' />
                  </div>
                </TableHead>
                <TableHead className='cursor-pointer' onClick={() => handleSort('grade_name')}>
                  <div className='flex items-center'>
                    Grado
                    <SortIcon field='grade_name' />
                  </div>
                </TableHead>
                <TableHead className='cursor-pointer' onClick={() => handleSort('status')}>
                  <div className='flex items-center'>
                    Estado
                    <SortIcon field='status' />
                  </div>
                </TableHead>
                <TableHead className='text-right'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAlumnos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='h-24 text-center'>
                    No hay alumnos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAlumnos.map((alumno) => (
                  <TableRow key={alumno.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(alumno.id)}
                        onCheckedChange={() => toggleSelect(alumno.id)}
                      />
                    </TableCell>
                    <TableCell className='font-medium'>
                      {alumno.name} {alumno.last_name}
                    </TableCell>
                    <TableCell>{alumno.grade_name || 'Sin asignar'}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[alumno.status]?.variant || 'secondary'}>
                        {statusConfig[alumno.status]?.label || alumno.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => openEditDialog(alumno)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(alumno)} className='text-red-600'>
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className='flex items-center justify-end space-x-2 py-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className='text-sm text-muted-foreground'>
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className='sm:max-w-[425px]'>
            <DialogHeader>
              <DialogTitle>
                {selectedAlumno ? 'Editar Alumno' : 'Nuevo Alumno'}
              </DialogTitle>
              <DialogDescription>
                {selectedAlumno 
                  ? 'Modifica los datos del alumno seleccionado.'
                  : 'Completa los datos para crear un nuevo alumno.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Nombre</Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder='Nombre del alumno'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='last_name'>Apellido</Label>
                <Input
                  id='last_name'
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder='Apellido del alumno'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='grade'>Grado</Label>
                <Select 
                  value={formData.grade_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, grade_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Selecciona un grado' />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name} ({grade.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='status'>Estado</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'active' | 'inactive' | 'suspended') => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Selecciona estado' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>Activo</SelectItem>
                    <SelectItem value='inactive'>Inactivo</SelectItem>
                    <SelectItem value='suspended'>Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant='outline' 
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={selectedAlumno ? handleUpdateAlumno : handleCreateAlumno}
                disabled={saving || !formData.name.trim() || !formData.last_name.trim() || !formData.grade_id}
              >
                {saving ? 'Guardando...' : selectedAlumno ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Alumno(s)</DialogTitle>
              <DialogDescription>
                {selectedAlumno 
                  ? `¿Estás seguro de que deseas eliminar el alumno "${selectedAlumno.name} ${selectedAlumno.last_name}"?`
                  : `¿Estás seguro de que deseas eliminar ${selectedIds.size} alumno(s)? Esta acción no se puede deshacer.`
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant='destructive' onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle>Importar Alumnos desde CSV</DialogTitle>
              <DialogDescription>
                Sube un archivo CSV con las columnas: APELLIDO1, APELLIDO2, NOMBRE1, NOMBRE2, GRADO
              </DialogDescription>
            </DialogHeader>
            
            <div className='space-y-4'>
              {!csvData.length ? (
                <div className='border-2 border-dashed rounded-lg p-8 text-center'>
                  <Upload className='h-8 w-8 mx-auto mb-4 text-muted-foreground' />
                  <p className='text-sm text-muted-foreground mb-4'>
                    Selecciona un archivo CSV
                  </p>
                  <Input
                    type='file'
                    accept='.csv'
                    onChange={handleFileSelect}
                    className='max-w-xs mx-auto'
                  />
                </div>
              ) : (
                <div className='space-y-4'>
                  <p className='text-sm'>
                    Se encontraron <strong>{csvData.length}</strong> registros en el archivo.
                  </p>
                  <div className='max-h-60 overflow-auto border rounded-md'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Apellido</TableHead>
                          <TableHead>Grupo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.slice(0, 10).map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>{row['NOMBRE 1']} {row['NOMBRE 2']}</TableCell>
                            <TableCell>{row['APELLIDO 1']} {row['APELLIDO 2']}</TableCell>
                            <TableCell>{row['GRUPO/CURSO'] || row['GRADO']}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {csvData.length > 10 && (
                    <p className='text-sm text-muted-foreground'>
                      ...y {csvData.length - 10} más
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant='outline' 
                onClick={() => {
                  setImportDialogOpen(false)
                  setCsvData([])
                }}
              >
                Cancelar
              </Button>
              {csvData.length > 0 && (
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? 'Importando...' : `Importar ${csvData.length} Alumnos`}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Main>
    </>
  )
}

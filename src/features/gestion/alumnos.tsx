import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Edit, Trash2, Search, Filter, Users, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/protected-route'

interface Alumno {
  id: string
  name: string
  last_name: string
  email: string
  grade_id: string
  grade_name: string
  status: 'active' | 'inactive'
  created_at: string
}

interface Grade {
  id: string
  name: string
  level: string
}

export function AlumnosPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [showAddAlumno, setShowAddAlumno] = useState(false)
  const [newAlumno, setNewAlumno] = useState({
    name: '',
    last_name: '',
    email: '',
    grade_id: ''
  })

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setGrades([
        { id: '1', name: '1° A', level: 'Primero' },
        { id: '2', name: '2° B', level: 'Segundo' },
        { id: '3', name: '3° C', level: 'Tercero' }
      ])
      
      setAlumnos([
        {
          id: '1',
          name: 'Ana Sofía',
          last_name: 'Martínez',
          email: 'ana.martinez@edugrade.com',
          grade_id: '1',
          grade_name: '1° A',
          status: 'active',
          created_at: '2024-01-15'
        },
        {
          id: '2',
          name: 'Carlos Andrés',
          last_name: 'García',
          email: 'carlos.garcia@edugrade.com',
          grade_id: '2',
          grade_name: '2° B',
          status: 'active',
          created_at: '2024-01-20'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredAlumnos = alumnos.filter(alumno => {
    const matchesSearch = alumno.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alumno.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alumno.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrade = gradeFilter === 'all' || alumno.grade_id === gradeFilter
    return matchesSearch && matchesGrade
  })

  const getStatusBadgeVariant = (status: string) => {
    return status === 'active' ? 'default' : 'secondary'
  }

  const handleAddAlumno = () => {
    const grade = grades.find(g => g.id === newAlumno.grade_id)
    const alumno: Alumno = {
      id: Date.now().toString(),
      name: newAlumno.name,
      last_name: newAlumno.last_name,
      email: newAlumno.email,
      grade_id: newAlumno.grade_id,
      grade_name: grade?.name || '',
      status: 'active',
      created_at: new Date().toISOString().split('T')[0]
    }
    setAlumnos([...alumnos, alumno])
    setNewAlumno({ name: '', last_name: '', email: '', grade_id: '' })
    setShowAddAlumno(false)
    toast.success('Alumno agregado exitosamente')
  }

  const handleDeleteAlumno = (alumnoId: string) => {
    setAlumnos(alumnos.filter(alumno => alumno.id !== alumnoId))
    toast.success('Alumno eliminado exitosamente')
  }

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-lg'>Cargando alumnos...</div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute 
      requiredPermission="canAccessAlumnos" 
      resource="la gestión de alumnos"
      requiredRole="SUPER_ADMIN o ADMIN_COLEGIO"
    >
      <div className='container mx-auto p-6 space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Alumnos</h1>
            <p className='text-muted-foreground'>Agrega y gestiona alumnos del sistema</p>
          </div>
          <Dialog open={showAddAlumno} onOpenChange={setShowAddAlumno}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className='mr-2 h-4 w-4' />
                Agregar Alumno
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Alumno</DialogTitle>
                <DialogDescription>
                  Registra un nuevo alumno en el sistema
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='name'>Nombres</Label>
                  <Input
                    id='name'
                    value={newAlumno.name}
                    onChange={(e) => setNewAlumno(prev => ({ ...prev, name: e.target.value }))}
                    placeholder='Ej: Ana Sofía'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='last_name'>Apellidos</Label>
                  <Input
                    id='last_name'
                    value={newAlumno.last_name}
                    onChange={(e) => setNewAlumno(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder='Ej: Martínez Pérez'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='email'>Correo Electrónico</Label>
                  <Input
                    id='email'
                    type='email'
                    value={newAlumno.email}
                    onChange={(e) => setNewAlumno(prev => ({ ...prev, email: e.target.value }))}
                    placeholder='Ej: ana.martinez@edugrade.com'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='grade'>Grado</Label>
                  <Select
                    value={newAlumno.grade_id}
                    onValueChange={(value) => setNewAlumno(prev => ({ ...prev, grade_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Selecciona un grado' />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name} - {grade.level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setShowAddAlumno(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddAlumno}>
                  Agregar Alumno
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estadísticas */}
        <div className='grid gap-4 md:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Alumnos</CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{alumnos.length}</div>
              <p className='text-xs text-muted-foreground'>Alumnos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Alumnos Activos</CardTitle>
              <GraduationCap className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {alumnos.filter(a => a.status === 'active').length}
              </div>
              <p className='text-xs text-muted-foreground'>Alumnos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Grados</CardTitle>
              <Filter className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{grades.length}</div>
              <p className='text-xs text-muted-foreground'>Grados configurados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex gap-4 items-center'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Buscar alumnos...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className='w-48'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='Filtrar por grado' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos los grados</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Alumnos */}
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>Lista de Alumnos ({filteredAlumnos.length})</h2>
          <div className='grid gap-4'>
            {filteredAlumnos.map((alumno) => (
              <Card key={alumno.id} className='hover:shadow-md transition-shadow'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <div className='h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center'>
                        <UserPlus className='h-6 w-6 text-blue-600' />
                      </div>
                      <div>
                        <h3 className='font-semibold'>{alumno.name} {alumno.last_name}</h3>
                        <p className='text-sm text-muted-foreground'>{alumno.email}</p>
                        <div className='flex gap-2 mt-2'>
                          <Badge variant='outline'>
                            {alumno.grade_name}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(alumno.status)}>
                            {alumno.status === 'active' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button variant='outline' size='sm'>
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button 
                        variant='outline' 
                        size='sm'
                        onClick={() => handleDeleteAlumno(alumno.id)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                  <div className='mt-4 text-sm text-muted-foreground'>
                    Registrado el: {new Date(alumno.created_at).toLocaleDateString('es-ES')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

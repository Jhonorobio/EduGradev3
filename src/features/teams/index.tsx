import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Building2, 
  Users, 
  Calendar, 
  BookOpen, 
  Award, 
  Mail, 
  Phone, 
  MapPin,
  GraduationCap,
  Settings,
  UserCheck
} from 'lucide-react'
import { useActiveColegiosList } from '@/hooks/use-active-colegios'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface TeacherInfo {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  subjects: string[]
  classes: string[]
  students: number
  experience: string
  joinDate: string
}

export function TeamsPage() {
  const { user, isSuperAdmin } = useAuth()
  const { colegios, hasActiveColegios, isLoading } = useActiveColegiosList()
  const [selectedColegio, setSelectedColegio] = useState<string>('')
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hasActiveColegios && colegios.length > 0 && !selectedColegio) {
      const firstColegio = colegios[0]
      setSelectedColegio(firstColegio.id)
      loadTeacherInfo(firstColegio.id)
    }
  }, [colegios, hasActiveColegios, selectedColegio])

  const loadTeacherInfo = async (colegioId: string) => {
    if (!user || isSuperAdmin) return
    
    setLoading(true)
    try {
      // Simular carga de información del profesor para el colegio seleccionado
      // En una implementación real, esto vendría de una API
      const mockTeacherInfo: TeacherInfo = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: '+1234567890',
        role: 'DOCENTE',
        subjects: ['Matemáticas', 'Física', 'Química'],
        classes: ['3° A', '3° B', '4° A'],
        students: 75,
        experience: '5 años',
        joinDate: '2019-03-15'
      }
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setTeacherInfo(mockTeacherInfo)
      toast.success('Información cargada correctamente')
    } catch (error) {
      console.error('Error loading teacher info:', error)
      toast.error('Error al cargar la información del profesor')
    } finally {
      setLoading(false)
    }
  }

  const handleColegioChange = (colegioId: string) => {
    setSelectedColegio(colegioId)
    loadTeacherInfo(colegioId)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Settings
      case 'teacher':
        return GraduationCap
      case 'staff':
        return UserCheck
      default:
        return UserCheck
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'teacher':
        return 'Docente'
      case 'staff':
        return 'Personal'
      default:
        return role
    }
  }

  const currentColegio = colegios.find(c => c.id === selectedColegio)

  if (isSuperAdmin) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Acceso de Super Admin
            </CardTitle>
            <CardDescription>
              Como Super Admin, tienes acceso a todos los colegios y no necesitas seleccionar uno específico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acceso Total al Sistema</h3>
              <p className="text-muted-foreground">
                Puedes gestionar todos los colegios desde las secciones de Usuarios y Colegios.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <Building2 className="h-8 w-8 animate-pulse mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando información de colegios...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasActiveColegios) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Sin Colegios Activos
            </CardTitle>
            <CardDescription>
              No tienes colegios activos asignados. Contacta al administrador para obtener acceso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Contacta al Administrador</h3>
              <p className="text-muted-foreground">
                Necesitas que te asignen a al menos un colegio activo para poder usar esta funcionalidad.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
        {currentColegio && (
          <Badge variant="outline" className="flex items-center gap-2">
            <Building2 className="h-3 w-3" />
            {currentColegio.name}
          </Badge>
        )}
      </div>

      {/* Selector de Colegios */}
      {colegios.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecciona un Colegio</CardTitle>
            <CardDescription>
              Elige el colegio para ver tu información y actividades vinculadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {colegios.map((colegio) => {
                const RoleIcon = getRoleIcon(colegio.role)
                return (
                  <Card 
                    key={colegio.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedColegio === colegio.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleColegioChange(colegio.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <Badge variant="outline" className="flex items-center gap-1">
                          <RoleIcon className="h-3 w-3" />
                          {getRoleLabel(colegio.role)}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{colegio.name}</h3>
                      <p className="text-sm text-muted-foreground">{colegio.code}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información del Profesor */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <GraduationCap className="h-8 w-8 animate-pulse mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando información del profesor...</p>
            </div>
          </CardContent>
        </Card>
      ) : teacherInfo ? (
        <div className="grid gap-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                    <p className="text-lg font-semibold">{teacherInfo.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p>{teacherInfo.email}</p>
                    </div>
                  </div>
                  {teacherInfo.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p>{teacherInfo.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Rol</label>
                    <Badge variant="secondary">{getRoleLabel(teacherInfo.role)}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Experiencia</label>
                    <p>{teacherInfo.experience}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fecha de Ingreso</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p>{new Date(teacherInfo.joinDate).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Académica */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Materias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teacherInfo.subjects.map((subject, index) => (
                    <Badge key={index} variant="outline">{subject}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teacherInfo.classes.map((className, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>{className}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Estudiantes</label>
                    <p className="text-2xl font-bold text-primary">{teacherInfo.students}</p>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Promedio por Clase</label>
                    <p className="text-lg">{Math.round(teacherInfo.students / teacherInfo.classes.length)} estudiantes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>
                Gestiona tu información y actividades en {currentColegio?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ver Materias
                </Button>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Gestionar Clases
                </Button>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendario
                </Button>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecciona un Colegio</h3>
            <p className="text-muted-foreground">
              Elige un colegio de la lista superior para ver tu información vinculada.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

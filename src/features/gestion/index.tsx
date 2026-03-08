import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Calculator, Settings, ChevronRight, Building2, GraduationCap, BookOpen } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { ColegioSelector } from '@/components/colegio-selector'
import { useColegio } from '@/hooks/use-colegio'
import { ProtectedRoute } from '@/components/protected-route'

export function GestionPage() {
  const { selectedColegio, colegioInfo } = useColegio()

  return (
    <ProtectedRoute 
      requiredPermission="canAccessGestion" 
      resource="la gestión del sistema"
      requiredRole="SUPER_ADMIN"
    >
      <div className='container mx-auto p-6 space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Gestión Multi-Colegio</h1>
            <p className='text-muted-foreground'>Administra múltiples instituciones educativas</p>
          </div>
        </div>

        {/* Selector de Colegio */}
        <ColegioSelector className='max-w-md' />

        {/* Gestión de Instituciones */}
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold flex items-center gap-2'>
            <Building2 className='h-5 w-5' />
            Gestión de Instituciones
          </h2>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            <Card className='hover:shadow-md transition-shadow cursor-pointer'>
              <Link to='/colegios'>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-lg font-medium'>Colegios</CardTitle>
                  <Building2 className='h-5 w-5 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground mb-4'>
                    Administra todas las instituciones educativas
                  </p>
                  <div className='flex items-center text-sm text-blue-600 hover:text-blue-700'>
                    <span>Administrar colegios</span>
                    <ChevronRight className='ml-1 h-4 w-4' />
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>

        {/* Gestión por Colegio */}
        {selectedColegio && (
          <div className='space-y-6'>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-blue-900 mb-2'>
                Gestión para: {colegioInfo?.name}
              </h3>
              <p className='text-sm text-blue-700'>
                Todas las siguientes gestiones se aplicarán al colegio <strong>{colegioInfo?.name}</strong> ({colegioInfo?.code})
              </p>
            </div>

            {/* Gestión de Personas */}
            <div className='space-y-4'>
              <h2 className='text-xl font-semibold flex items-center gap-2'>
                <UserPlus className='h-5 w-5' />
                Gestión de Alumnos
              </h2>
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                <Card className='hover:shadow-md transition-shadow cursor-pointer'>
                  <Link to='/gestion/alumnos'>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-lg font-medium'>Alumnos</CardTitle>
                      <UserPlus className='h-5 w-5 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-muted-foreground mb-4'>
                        Gestiona alumnos del colegio
                      </p>
                      <div className='flex items-center text-sm text-blue-600 hover:text-blue-700'>
                        <span>Gestionar alumnos</span>
                        <ChevronRight className='ml-1 h-4 w-4' />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            </div>

            {/* Gestión Académica */}
            <div className='space-y-4'>
              <h2 className='text-xl font-semibold flex items-center gap-2'>
                <BookOpen className='h-5 w-5' />
                Gestión Académica
              </h2>
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                <Card className='hover:shadow-md transition-shadow cursor-pointer'>
                  <Link to='/gestion/ponderado'>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-lg font-medium'>Ponderado</CardTitle>
                      <Calculator className='h-5 w-5 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-muted-foreground mb-4'>
                        Configura ponderado del colegio
                      </p>
                      <div className='flex items-center text-sm text-blue-600 hover:text-blue-700'>
                        <span>Configurar ponderado</span>
                        <ChevronRight className='ml-1 h-4 w-4' />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay colegio seleccionado */}
        {!selectedColegio && (
          <div className='text-center py-12'>
            <Building2 className='h-16 w-16 mx-auto text-muted-foreground mb-4' />
            <h3 className='text-xl font-semibold mb-2'>Selecciona un Colegio</h3>
            <p className='text-muted-foreground max-w-md mx-auto'>
              Para acceder a la gestión de alumnos y configuración académica, 
              primero selecciona un colegio del selector superior.
            </p>
          </div>
        )}

        {/* Estadísticas Globales */}
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>Resumen del Sistema</h2>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Total Colegios</CardTitle>
                <Building2 className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>3</div>
                <p className='text-xs text-muted-foreground'>Instituciones registradas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Total Alumnos</CardTitle>
                <GraduationCap className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>0</div>
                <p className='text-xs text-muted-foreground'>En todos los colegios</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Configuraciones</CardTitle>
                <Settings className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>4</div>
                <p className='text-xs text-muted-foreground'>Categorías activas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Planillas</CardTitle>
                <BookOpen className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>12</div>
                <p className='text-xs text-muted-foreground'>Planillas activas</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Re-exportar otros componentes
export { AlumnosPage } from './alumnos'
export { PonderadoPage } from './ponderado'

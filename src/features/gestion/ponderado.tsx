import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calculator, Plus, Edit, Trash2, Settings, Sliders, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/protected-route'
import { getColegios } from '@/services/colegios'
import { getColegioSettings, updateColegioSettings, validateColegioSettings, type ColegioSettings } from '@/services/colegio-settings'
import { ColegioSettingsDialog } from '@/features/admin/colegio-settings-dialog'

interface PonderadoItem {
  id: string
  name: string
  percentage: number
  scale: '1-5' | '1-10'
  description: string
  is_active: boolean
}

interface CategoryConfig {
  id: string
  name: string
  display_name: string
  color: string
  group: string
}

export function PonderadoPage() {
  const [colegios, setColegios] = useState<any[]>([])
  const [selectedColegio, setSelectedColegio] = useState<string>('')
  const [colegioSettings, setColegioSettings] = useState<ColegioSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)

  useEffect(() => {
    loadColegios()
  }, [])

  useEffect(() => {
    if (selectedColegio) {
      loadColegioSettings()
    }
  }, [selectedColegio])

  const loadColegios = async () => {
    try {
      const data = await getColegios()
      setColegios(data)
      if (data.length > 0 && !selectedColegio) {
        setSelectedColegio(data[0].id)
      }
    } catch (error) {
      console.error('Error loading colegios:', error)
      toast.error('Error al cargar los colegios')
    } finally {
      setLoading(false)
    }
  }

  const loadColegioSettings = async () => {
    if (!selectedColegio) return

    try {
      const settings = await getColegioSettings(selectedColegio)
      setColegioSettings(settings)
    } catch (error) {
      console.error('Error loading colegio settings:', error)
      toast.error('Error al cargar la configuración del colegio')
    }
  }

  const handleOpenSettingsDialog = () => {
    if (!selectedColegio) {
      toast.error('Por favor selecciona un colegio primero')
      return
    }
    setShowSettingsDialog(true)
  }

  const selectedColegioData = colegios.find(c => c.id === selectedColegio)

  const getTotalCategoryWeight = () => {
    if (!colegioSettings) return 0
    return Object.values(colegioSettings.category_weights).reduce((sum, weight) => sum + weight, 0)
  }

  const getTotalPeriodWeight = () => {
    if (!colegioSettings) return 0
    return Object.values(colegioSettings.period_weights).reduce((sum, weight) => sum + weight, 0)
  }

  const isNewConfiguration = !colegioSettings?.id

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-lg'>Cargando configuración...</div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute 
      requiredPermission="canAccessPonderado" 
      resource="la configuración del ponderado"
      requiredRole="SUPER_ADMIN o ADMIN_COLEGIO"
    >
      <div className='container mx-auto p-6 space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Configuración de Ponderados</h1>
            <p className='text-muted-foreground'>Configura los ponderados de calificación por colegio</p>
          </div>
          <Button onClick={handleOpenSettingsDialog}>
            <Settings className='mr-2 h-4 w-4' />
            Configurar Ponderados
          </Button>
        </div>

        {/* Selección de Colegio */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Building2 className='h-5 w-5' />
              Selección de Colegio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-4'>
              <div className='flex-1 max-w-sm'>
                <Label htmlFor='colegio-select'>Colegio</Label>
                <Select
                  value={selectedColegio}
                  onValueChange={setSelectedColegio}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Selecciona un colegio' />
                  </SelectTrigger>
                  <SelectContent>
                    {colegios.map((colegio) => (
                      <SelectItem key={colegio.id} value={colegio.id}>
                        {colegio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedColegioData && (
                <div className='flex items-center gap-2'>
                  <Badge variant='outline'>
                    {selectedColegioData.code}
                  </Badge>
                  <Badge variant={selectedColegioData.status === 'active' ? 'default' : 'secondary'}>
                    {selectedColegioData.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Configuración */}
        {colegioSettings && (
          <div className='grid gap-4 md:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Períodos</CardTitle>
                <Calculator className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{colegioSettings.period_count}</div>
                <p className='text-xs text-muted-foreground'>Períodos académicos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Peso Períodos</CardTitle>
                <Sliders className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getTotalPeriodWeight() === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                  {getTotalPeriodWeight()}%
                </div>
                <p className='text-xs text-muted-foreground'>
                  {getTotalPeriodWeight() === 100 ? 'Configuración correcta' : 'Requiere ajuste'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Peso Categorías</CardTitle>
                <Settings className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getTotalCategoryWeight() === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                  {getTotalCategoryWeight()}%
                </div>
                <p className='text-xs text-muted-foreground'>
                  {getTotalCategoryWeight() === 100 ? 'Configuración correcta' : 'Requiere ajuste'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Estado</CardTitle>
                <Building2 className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${isNewConfiguration ? 'text-orange-600' : 'text-green-600'}`}>
                  {isNewConfiguration ? 'Por Defecto' : 'Configurado'}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {isNewConfiguration ? 'Usando configuración por defecto' : 'Configuración personalizada'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuración Detallada */}
        {colegioSettings && (
          <div className='space-y-6'>
            {/* Alerta si es configuración por defecto */}
            {isNewConfiguration && (
              <Card className='border-orange-200 bg-orange-50'>
                <CardContent className='pt-6'>
                  <div className='flex items-center gap-4'>
                    <Settings className='h-8 w-8 text-orange-600' />
                    <div>
                      <h3 className='font-semibold text-orange-800'>Configuración por Defecto</h3>
                      <p className='text-sm text-orange-700'>
                        Este colegio está usando la configuración por defecto. Haz clic en "Configurar Ponderados" para personalizarla.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Configuración de Períodos */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Períodos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid gap-4'>
                  <div className='grid grid-cols-3 gap-4'>
                    {Array.from({ length: colegioSettings.period_count }, (_, i) => i + 1).map((period) => (
                      <div key={period} className='space-y-2'>
                        <Label>Período {period}</Label>
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline'>
                            {colegioSettings.period_weights[period.toString()] || 0}%
                          </Badge>
                          <span className='text-sm text-muted-foreground'>
                            Ponderado
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Categorías */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Categorías</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-4'>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>Apuntes y Tareas</Badge>
                      <Badge variant='secondary'>
                        {colegioSettings.category_weights.apuntes_tareas}%
                      </Badge>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>Talleres y Exposiciones</Badge>
                      <Badge variant='secondary'>
                        {colegioSettings.category_weights.talleres_exposiciones}%
                      </Badge>
                    </div>
                  </div>
                  <div className='space-y-4'>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>Actitudinal</Badge>
                      <Badge variant='secondary'>
                        {colegioSettings.category_weights.actitudinal}%
                      </Badge>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>Evaluación</Badge>
                      <Badge variant='secondary'>
                        {colegioSettings.category_weights.evaluacion}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Puntajes Máximos */}
            <Card>
              <CardHeader>
                <CardTitle>Puntajes Máximos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Actitudinal</Label>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>
                        Máximo: {colegioSettings.max_scores.actitudinal}
                      </Badge>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label>Evaluación</Label>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>
                        Máximo: {colegioSettings.max_scores.evaluacion}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Diálogo de Configuración */}
        <ColegioSettingsDialog
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          colegioId={selectedColegio}
          colegioName={selectedColegioData?.name || ''}
        />
      </div>
    </ProtectedRoute>
  )
}

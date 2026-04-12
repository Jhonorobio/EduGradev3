import { useState, useEffect } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import {
  getColegioSettings,
  updateColegioSettings,
  validateColegioSettings,
  type ColegioSettings,
} from '@/services/colegio-settings'
import { Settings, Calculator, Save, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'

const route = getRouteApi(
  '/_authenticated/gestion/colegios/$colegioId/academic-settings/weights'
)

export function ColegioWeights() {
  const { colegioId } = route.useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<ColegioSettings>({
    id: '',
    colegio_id: '',
    period_count: 3,
    period_weights: { '1': 30, '2': 30, '3': 40 },
    category_weights: {
      apuntes_tareas: 20,
      talleres_exposiciones: 20,
      actitudinal: 20,
      evaluacion: 40,
    },
    escala_calificacion: '1-10',
    activity_types: {
      apuntes_tareas: ['Tarea', 'Investigación', 'Resumen', 'Mapa conceptual'],
      talleres_exposiciones: [
        'Taller práctico',
        'Exposición oral',
        'Demostración',
        'Proyecto',
      ],
    },
    created_at: '',
    updated_at: '',
  })
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    loadSettings()
  }, [colegioId])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await getColegioSettings(colegioId)

      const settingsWithDefaults = {
        ...data,
        activity_types: {
          apuntes_tareas: data.activity_types?.apuntes_tareas || [
            'Tarea',
            'Investigación',
            'Resumen',
            'Mapa conceptual',
          ],
          talleres_exposiciones: data.activity_types?.talleres_exposiciones || [
            'Taller práctico',
            'Exposición oral',
            'Demostración',
            'Proyecto',
          ],
        },
      }

      setSettings(settingsWithDefaults)
      setErrors([])
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)

      const validationErrors = validateColegioSettings(settings)
      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        return
      }

      await updateColegioSettings(colegioId, settings)
      toast.success('Configuración guardada exitosamente')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const updatePeriodWeights = (period: string, weight: number) => {
    if (!settings) return

    const newPeriodWeights = { ...settings.period_weights }
    newPeriodWeights[period] = weight
    setSettings({ ...settings, period_weights: newPeriodWeights })
  }

  const updateCategoryWeights = (category: string, weight: number) => {
    if (!settings) return

    const newCategoryWeights = { ...settings.category_weights }
    newCategoryWeights[category] = weight
    setSettings({ ...settings, category_weights: newCategoryWeights })
  }

  const updateEscalaCalificacion = (escala: '1-5' | '1-10') => {
    if (!settings) return

    setSettings({ ...settings, escala_calificacion: escala })
  }

  const updateActivityType = (
    category: 'apuntes_tareas' | 'talleres_exposiciones',
    index: number,
    value: string
  ) => {
    if (!settings) return

    const newActivityTypes = { ...settings.activity_types }
    const categoryTypes = newActivityTypes[category]
      ? [...newActivityTypes[category]]
      : []
    categoryTypes[index] = value
    newActivityTypes[category] = categoryTypes

    setSettings({ ...settings, activity_types: newActivityTypes })
  }

  const addActivityType = (
    category: 'apuntes_tareas' | 'talleres_exposiciones'
  ) => {
    if (!settings) return

    const newActivityTypes = { ...settings.activity_types }
    const categoryTypes = newActivityTypes[category]
      ? [...newActivityTypes[category]]
      : []
    categoryTypes.push('')
    newActivityTypes[category] = categoryTypes

    setSettings({ ...settings, activity_types: newActivityTypes })
  }

  const removeActivityType = (
    category: 'apuntes_tareas' | 'talleres_exposiciones',
    index: number
  ) => {
    if (!settings) return

    const newActivityTypes = { ...settings.activity_types }
    const categoryTypes = newActivityTypes[category]
      ? [...newActivityTypes[category]]
      : []
    categoryTypes.splice(index, 1)
    newActivityTypes[category] = categoryTypes

    setSettings({ ...settings, activity_types: newActivityTypes })
  }

  const getTotalPeriodWeight = () => {
    if (!settings) return 0
    return Object.values(settings.period_weights).reduce(
      (sum, weight) => sum + weight,
      0
    )
  }

  const getTotalCategoryWeight = () => {
    if (!settings) return 0
    return Object.values(settings.category_weights).reduce(
      (sum, weight) => sum + weight,
      0
    )
  }

  if (loading) {
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
          <div className='flex min-h-96 items-center justify-center'>
            <div className='text-center'>
              <Settings className='mx-auto mb-4 h-12 w-12 animate-spin text-muted-foreground' />
              <p className='text-muted-foreground'>Cargando configuración...</p>
            </div>
          </div>
        </Main>
      </>
    )
  }

  if (!settings) {
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
          <div className='py-12 text-center'>
            <Settings className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
            <h3 className='mb-2 text-lg font-semibold'>
              No se encontró configuración
            </h3>
            <p className='text-muted-foreground'>
              No existe configuración para este colegio.
            </p>
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
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Link to={`/gestion/colegios/${colegioId}/academic-settings`}>
              <Button variant='outline' size='sm'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Volver
              </Button>
            </Link>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                Configuración de Ponderados
              </h2>
              <p className='text-muted-foreground'>
                Configura los ponderados de calificaciones específicos para este
                colegio.
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className='mr-2 h-4 w-4' />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>

        {errors.length > 0 && (
          <Card className='border-red-200 bg-red-50'>
            <CardContent className='pt-6'>
              <div className='space-y-2'>
                {errors.map((error, index) => (
                  <p key={index} className='text-sm text-red-600'>
                    • {error}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className='grid gap-6 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calculator className='h-5 w-5' />
                Configuración de Períodos
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Label htmlFor='period_count'>Número de Períodos</Label>
                <Input
                  id='period_count'
                  type='number'
                  min='1'
                  max='10'
                  value={settings.period_count}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      period_count: parseInt(e.target.value) || 1,
                    })
                  }
                  className='w-32'
                />
              </div>

              <Separator />

              <div>
                <Label className='text-base font-medium'>
                  Pesos de Períodos (%)
                </Label>
                <div className='mt-2 grid grid-cols-3 gap-4'>
                  {Array.from(
                    { length: settings.period_count },
                    (_, i) => i + 1
                  ).map((period) => (
                    <div key={period} className='space-y-2'>
                      <Label htmlFor={`period_${period}`}>
                        Período {period}
                      </Label>
                      <Input
                        id={`period_${period}`}
                        type='number'
                        min='0'
                        max='100'
                        step='0.1'
                        value={settings.period_weights[period.toString()] || 0}
                        onChange={(e) =>
                          updatePeriodWeights(
                            period.toString(),
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className='w-full'
                      />
                    </div>
                  ))}
                </div>
                <div className='mt-2'>
                  <Badge
                    variant={
                      getTotalPeriodWeight() === 100 ? 'default' : 'destructive'
                    }
                  >
                    Total: {getTotalPeriodWeight().toFixed(1)}%
                  </Badge>
                  {getTotalPeriodWeight() !== 100 && (
                    <p className='mt-1 text-sm text-red-600'>
                      La suma debe ser 100%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calculator className='h-5 w-5' />
                Pesos de Categorías (%)
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='apuntes_tareas'>Apuntes y Tareas</Label>
                  <Input
                    id='apuntes_tareas'
                    type='number'
                    min='0'
                    max='100'
                    step='0.1'
                    value={settings.category_weights.apuntes_tareas}
                    onChange={(e) =>
                      updateCategoryWeights(
                        'apuntes_tareas',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='talleres_exposiciones'>
                    Talleres y Exposiciones
                  </Label>
                  <Input
                    id='talleres_exposiciones'
                    type='number'
                    min='0'
                    max='100'
                    step='0.1'
                    value={settings.category_weights.talleres_exposiciones}
                    onChange={(e) =>
                      updateCategoryWeights(
                        'talleres_exposiciones',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='actitudinal'>Actitudinal</Label>
                  <Input
                    id='actitudinal'
                    type='number'
                    min='0'
                    max='100'
                    step='0.1'
                    value={settings.category_weights.actitudinal}
                    onChange={(e) =>
                      updateCategoryWeights(
                        'actitudinal',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='evaluacion'>Evaluación</Label>
                  <Input
                    id='evaluacion'
                    type='number'
                    min='0'
                    max='100'
                    step='0.1'
                    value={settings.category_weights.evaluacion}
                    onChange={(e) =>
                      updateCategoryWeights(
                        'evaluacion',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
              </div>

              <div className='mt-2'>
                <Badge
                  variant={
                    getTotalCategoryWeight() === 100 ? 'default' : 'destructive'
                  }
                >
                  Total: {getTotalCategoryWeight().toFixed(1)}%
                </Badge>
                {getTotalCategoryWeight() !== 100 && (
                  <p className='mt-1 text-sm text-red-600'>
                    La suma debe ser 100%
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calculator className='h-5 w-5' />
                Tipos de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-4'>
                <div>
                  <Label>Apuntes y Tareas</Label>
                  <div className='space-y-2'>
                    {settings.activity_types?.apuntes_tareas?.map(
                      (type, index) => (
                        <div key={index} className='flex items-center gap-2'>
                          <Input
                            value={type}
                            onChange={(e) =>
                              updateActivityType(
                                'apuntes_tareas',
                                index,
                                e.target.value
                              )
                            }
                            placeholder='Nombre del tipo de actividad'
                          />
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              removeActivityType('apuntes_tareas', index)
                            }
                          >
                            X
                          </Button>
                        </div>
                      )
                    )}
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => addActivityType('apuntes_tareas')}
                    >
                      + Agregar tipo
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Talleres y Exposiciones</Label>
                  <div className='space-y-2'>
                    {settings.activity_types?.talleres_exposiciones?.map(
                      (type, index) => (
                        <div key={index} className='flex items-center gap-2'>
                          <Input
                            value={type}
                            onChange={(e) =>
                              updateActivityType(
                                'talleres_exposiciones',
                                index,
                                e.target.value
                              )
                            }
                            placeholder='Nombre del tipo de actividad'
                          />
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              removeActivityType('talleres_exposiciones', index)
                            }
                          >
                            X
                          </Button>
                        </div>
                      )
                    )}
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => addActivityType('talleres_exposiciones')}
                    >
                      + Agregar tipo
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calculator className='h-5 w-5' />
                Escala de Calificación
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='escala_calificacion'>
                  Escala para Notas de Actividades
                </Label>
                <Select
                  value={settings.escala_calificacion}
                  onValueChange={(value: '1-5' | '1-10') =>
                    updateEscalaCalificacion(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Selecciona escala' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='1-5'>1 a 5 puntos</SelectItem>
                    <SelectItem value='1-10'>1 a 10 puntos</SelectItem>
                  </SelectContent>
                </Select>
                <p className='mt-2 text-sm text-muted-foreground'>
                  Esta escala se utilizará para asignar las notas de todas las
                  actividades del colegio.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calculator className='h-5 w-5' />
                Rangos de Desempeño
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='mb-4 text-sm text-muted-foreground'>
                Configura los rangos para clasificar el desempeño de los
                estudiantes según la escala de calificación seleccionada (
                {settings.escala_calificacion}).
              </p>

              <div className='grid grid-cols-2 gap-4'>
                {/* Bajo */}
                <div className='space-y-2 rounded-lg border border-red-200 bg-red-50 p-4'>
                  <Label className='font-medium text-red-700'>Bajo</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      type='number'
                      min={settings.escala_calificacion === '1-5' ? 1 : 1}
                      max={settings.escala_calificacion === '1-5' ? 5 : 10}
                      step='0.1'
                      value={
                        settings.performance_scale?.bajo?.min ||
                        (settings.escala_calificacion === '1-5' ? 1 : 1)
                      }
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0
                        setSettings({
                          ...settings,
                          performance_scale: {
                            ...settings.performance_scale,
                            bajo: {
                              ...settings.performance_scale?.bajo,
                              min: newValue,
                            },
                          },
                        })
                      }}
                      className='w-20'
                    />
                    <span className='text-sm'>a</span>
                    <Input
                      type='number'
                      min={settings.escala_calificacion === '1-5' ? 1 : 1}
                      max={settings.escala_calificacion === '1-5' ? 5 : 10}
                      step='0.1'
                      value={
                        settings.performance_scale?.bajo?.max ||
                        (settings.escala_calificacion === '1-5' ? 2.9 : 5.9)
                      }
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0
                        setSettings({
                          ...settings,
                          performance_scale: {
                            ...settings.performance_scale,
                            bajo: {
                              ...settings.performance_scale?.bajo,
                              max: newValue,
                            },
                          },
                        })
                      }}
                      className='w-20'
                    />
                  </div>
                </div>

                {/* Básico */}
                <div className='space-y-2 rounded-lg border border-orange-200 bg-orange-50 p-4'>
                  <Label className='font-medium text-orange-700'>Básico</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      type='number'
                      min={settings.escala_calificacion === '1-5' ? 1 : 1}
                      max={settings.escala_calificacion === '1-5' ? 5 : 10}
                      step='0.1'
                      value={
                        settings.performance_scale?.basico?.min ||
                        (settings.escala_calificacion === '1-5' ? 3 : 6)
                      }
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0
                        setSettings({
                          ...settings,
                          performance_scale: {
                            ...settings.performance_scale,
                            basico: {
                              ...settings.performance_scale?.basico,
                              min: newValue,
                            },
                          },
                        })
                      }}
                      className='w-20'
                    />
                    <span className='text-sm'>a</span>
                    <Input
                      type='number'
                      min={settings.escala_calificacion === '1-5' ? 1 : 1}
                      max={settings.escala_calificacion === '1-5' ? 5 : 10}
                      step='0.1'
                      value={
                        settings.performance_scale?.basico?.max ||
                        (settings.escala_calificacion === '1-5' ? 3.9 : 7.9)
                      }
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0
                        setSettings({
                          ...settings,
                          performance_scale: {
                            ...settings.performance_scale,
                            basico: {
                              ...settings.performance_scale?.basico,
                              max: newValue,
                            },
                          },
                        })
                      }}
                      className='w-20'
                    />
                  </div>
                </div>

                {/* Alto */}
                <div className='space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4'>
                  <Label className='font-medium text-blue-700'>Alto</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      type='number'
                      min={settings.escala_calificacion === '1-5' ? 1 : 1}
                      max={settings.escala_calificacion === '1-5' ? 5 : 10}
                      step='0.1'
                      value={
                        settings.performance_scale?.alto?.min ||
                        (settings.escala_calificacion === '1-5' ? 4 : 8)
                      }
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0
                        setSettings({
                          ...settings,
                          performance_scale: {
                            ...settings.performance_scale,
                            alto: {
                              ...settings.performance_scale?.alto,
                              min: newValue,
                            },
                          },
                        })
                      }}
                      className='w-20'
                    />
                    <span className='text-sm'>a</span>
                    <Input
                      type='number'
                      min={settings.escala_calificacion === '1-5' ? 1 : 1}
                      max={settings.escala_calificacion === '1-5' ? 5 : 10}
                      step='0.1'
                      value={
                        settings.performance_scale?.alto?.max ||
                        (settings.escala_calificacion === '1-5' ? 4.4 : 9.4)
                      }
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0
                        setSettings({
                          ...settings,
                          performance_scale: {
                            ...settings.performance_scale,
                            alto: {
                              ...settings.performance_scale?.alto,
                              max: newValue,
                            },
                          },
                        })
                      }}
                      className='w-20'
                    />
                  </div>
                </div>

                {/* Superior */}
                <div className='space-y-2 rounded-lg border border-green-200 bg-green-50 p-4'>
                  <Label className='font-medium text-green-700'>Superior</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      type='number'
                      min={settings.escala_calificacion === '1-5' ? 1 : 1}
                      max={settings.escala_calificacion === '1-5' ? 5 : 10}
                      step='0.1'
                      value={
                        settings.performance_scale?.superior?.min ||
                        (settings.escala_calificacion === '1-5' ? 4.5 : 9.5)
                      }
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0
                        setSettings({
                          ...settings,
                          performance_scale: {
                            ...settings.performance_scale,
                            superior: {
                              ...settings.performance_scale?.superior,
                              min: newValue,
                            },
                          },
                        })
                      }}
                      className='w-20'
                    />
                    <span className='text-sm'>a</span>
                    <Input
                      type='number'
                      min={settings.escala_calificacion === '1-5' ? 1 : 1}
                      max={settings.escala_calificacion === '1-5' ? 5 : 10}
                      step='0.1'
                      value={
                        settings.performance_scale?.superior?.max ||
                        (settings.escala_calificacion === '1-5' ? 5 : 10)
                      }
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0
                        setSettings({
                          ...settings,
                          performance_scale: {
                            ...settings.performance_scale,
                            superior: {
                              ...settings.performance_scale?.superior,
                              max: newValue,
                            },
                          },
                        })
                      }}
                      className='w-20'
                    />
                  </div>
                </div>
              </div>

              <div className='mt-4 rounded-lg bg-muted p-4'>
                <h4 className='mb-2 font-medium'>Vista previa de rangos:</h4>
                <div className='grid grid-cols-2 gap-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='font-medium text-red-600'>Bajo:</span>
                    <span>
                      {settings.performance_scale?.bajo?.min ||
                        (settings.escala_calificacion === '1-5' ? 1 : 1)}{' '}
                      -{' '}
                      {settings.performance_scale?.bajo?.max ||
                        (settings.escala_calificacion === '1-5' ? 2.9 : 5.9)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium text-orange-600'>Básico:</span>
                    <span>
                      {settings.performance_scale?.basico?.min ||
                        (settings.escala_calificacion === '1-5' ? 3 : 6)}{' '}
                      -{' '}
                      {settings.performance_scale?.basico?.max ||
                        (settings.escala_calificacion === '1-5' ? 3.9 : 7.9)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium text-blue-600'>Alto:</span>
                    <span>
                      {settings.performance_scale?.alto?.min ||
                        (settings.escala_calificacion === '1-5' ? 4 : 8)}{' '}
                      -{' '}
                      {settings.performance_scale?.alto?.max ||
                        (settings.escala_calificacion === '1-5' ? 4.4 : 9.4)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium text-green-600'>
                      Superior:
                    </span>
                    <span>
                      {settings.performance_scale?.superior?.min ||
                        (settings.escala_calificacion === '1-5'
                          ? 4.5
                          : 9.5)}{' '}
                      -{' '}
                      {settings.performance_scale?.superior?.max ||
                        (settings.escala_calificacion === '1-5' ? 5 : 10)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

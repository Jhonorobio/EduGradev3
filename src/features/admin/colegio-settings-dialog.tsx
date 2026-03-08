import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { getColegioSettings, updateColegioSettings, validateColegioSettings, type ColegioSettings } from '@/services/colegio-settings'
import { Settings, Calculator, Save } from 'lucide-react'

interface ColegioSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  colegioId: string
  colegioName: string
}

export function ColegioSettingsDialog({ open, onOpenChange, colegioId, colegioName }: ColegioSettingsDialogProps) {
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
      evaluacion: 40
    },
    escala_calificacion: '1-10',
    activity_types: {
      apuntes_tareas: ['Tarea', 'Investigación', 'Resumen', 'Mapa conceptual'],
      talleres_exposiciones: ['Taller práctico', 'Exposición oral', 'Demostración', 'Proyecto']
    },
    created_at: '',
    updated_at: ''
  })
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (open && colegioId) {
      loadSettings()
    }
  }, [open, colegioId])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await getColegioSettings(colegioId)
      
      // Asegurar que activity_types tenga valores por defecto
      const settingsWithDefaults = {
        ...data,
        activity_types: {
          apuntes_tareas: data.activity_types?.apuntes_tareas || ['Tarea', 'Investigación', 'Resumen', 'Mapa conceptual'],
          talleres_exposiciones: data.activity_types?.talleres_exposiciones || ['Taller práctico', 'Exposición oral', 'Demostración', 'Proyecto']
        }
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
      
      // Validate settings
      const validationErrors = validateColegioSettings(settings)
      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        return
      }
      
      await updateColegioSettings(colegioId, settings)
      toast.success('Configuración guardada exitosamente')
      onOpenChange(false)
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

  const updateActivityType = (category: 'apuntes_tareas' | 'talleres_exposiciones', index: number, value: string) => {
    if (!settings) return
    
    const newActivityTypes = { ...settings.activity_types }
    const categoryTypes = newActivityTypes[category] ? [...newActivityTypes[category]] : []
    categoryTypes[index] = value
    newActivityTypes[category] = categoryTypes
    
    setSettings({ ...settings, activity_types: newActivityTypes })
  }

  const addActivityType = (category: 'apuntes_tareas' | 'talleres_exposiciones') => {
    if (!settings) return
    
    const newActivityTypes = { ...settings.activity_types }
    const categoryTypes = newActivityTypes[category] ? [...newActivityTypes[category]] : []
    categoryTypes.push('') // Add empty string as placeholder
    newActivityTypes[category] = categoryTypes
    
    setSettings({ ...settings, activity_types: newActivityTypes })
  }

  const removeActivityType = (category: 'apuntes_tareas' | 'talleres_exposiciones', index: number) => {
    if (!settings) return
    
    const newActivityTypes = { ...settings.activity_types }
    const categoryTypes = newActivityTypes[category] ? [...newActivityTypes[category]] : []
    categoryTypes.splice(index, 1)
    newActivityTypes[category] = categoryTypes
    
    setSettings({ ...settings, activity_types: newActivityTypes })
  }

  const getTotalPeriodWeight = () => {
    if (!settings) return 0
    return Object.values(settings.period_weights).reduce((sum, weight) => sum + weight, 0)
  }

  const getTotalCategoryWeight = () => {
    if (!settings) return 0
    return Object.values(settings.category_weights).reduce((sum, weight) => sum + weight, 0)
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cargando Configuración</DialogTitle>
            <DialogDescription>
              Cargando la configuración de ponderados del colegio...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Cargando configuración...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!settings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sin Configuración</DialogTitle>
            <DialogDescription>
              No existe configuración para este colegio.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontró configuración</h3>
            <p className="text-muted-foreground">No existe configuración para este colegio.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Ponderados - {colegioName}
          </DialogTitle>
          <DialogDescription>
            Configura los ponderados de calificaciones específicos para este colegio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">• {error}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Period Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Configuración de Períodos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="period_count">Número de Períodos</Label>
                  <Input
                    id="period_count"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.period_count}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      period_count: parseInt(e.target.value) || 1 
                    })}
                    className="w-32"
                  />
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-base font-medium">Pesos de Períodos (%)</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {Array.from({ length: settings.period_count }, (_, i) => i + 1).map((period) => (
                      <div key={period} className="space-y-2">
                        <Label htmlFor={`period_${period}`}>Período {period}</Label>
                        <Input
                          id={`period_${period}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={settings.period_weights[period.toString()] || 0}
                          onChange={(e) => updatePeriodWeights(period.toString(), parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Badge variant={getTotalPeriodWeight() === 100 ? "default" : "destructive"}>
                      Total: {getTotalPeriodWeight().toFixed(1)}%
                    </Badge>
                    {getTotalPeriodWeight() !== 100 && (
                      <p className="text-sm text-red-600 mt-1">La suma debe ser 100%</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Weights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Pesos de Categorías (%)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apuntes_tareas">Apuntes y Tareas</Label>
                  <Input
                    id="apuntes_tareas"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.category_weights.apuntes_tareas}
                    onChange={(e) => updateCategoryWeights('apuntes_tareas', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="talleres_exposiciones">Talleres y Exposiciones</Label>
                  <Input
                    id="talleres_exposiciones"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.category_weights.talleres_exposiciones}
                    onChange={(e) => updateCategoryWeights('talleres_exposiciones', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="actitudinal">Actitudinal</Label>
                  <Input
                    id="actitudinal"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.category_weights.actitudinal}
                    onChange={(e) => updateCategoryWeights('actitudinal', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="evaluacion">Evaluación</Label>
                  <Input
                    id="evaluacion"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.category_weights.evaluacion}
                    onChange={(e) => updateCategoryWeights('evaluacion', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="mt-2">
                <Badge variant={getTotalCategoryWeight() === 100 ? "default" : "destructive"}>
                  Total: {getTotalCategoryWeight().toFixed(1)}%
                </Badge>
                {getTotalCategoryWeight() !== 100 && (
                  <p className="text-sm text-red-600 mt-1">La suma debe ser 100%</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tipos de Actividad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Tipos de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Apuntes y Tareas</Label>
                  <div className="space-y-2">
                    {settings.activity_types?.apuntes_tareas?.map((type, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={type}
                          onChange={(e) => updateActivityType('apuntes_tareas', index, e.target.value)}
                          placeholder="Nombre del tipo de actividad"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeActivityType('apuntes_tareas', index)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addActivityType('apuntes_tareas')}
                    >
                      + Agregar tipo
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Talleres y Exposiciones</Label>
                  <div className="space-y-2">
                    {settings.activity_types?.talleres_exposiciones?.map((type, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={type}
                          onChange={(e) => updateActivityType('talleres_exposiciones', index, e.target.value)}
                          placeholder="Nombre del tipo de actividad"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeActivityType('talleres_exposiciones', index)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addActivityType('talleres_exposiciones')}
                    >
                      + Agregar tipo
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Escala de Calificación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Escala de Calificación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="escala_calificacion">Escala para Notas de Actividades</Label>
                <Select
                  value={settings.escala_calificacion}
                  onValueChange={(value: '1-5' | '1-10') => updateEscalaCalificacion(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona escala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1 a 5 puntos</SelectItem>
                    <SelectItem value="1-10">1 a 10 puntos</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  Esta escala se utilizará para asignar las notas de todas las actividades del colegio.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

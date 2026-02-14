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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Save, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getAcademicSettings, saveAcademicSettings, AcademicSettings } from '@/services/academic-settings'
import { toast } from 'sonner'
import { PeriodsSkeleton } from './components/academic-skeletons'

const route = getRouteApi('/_authenticated/academic-settings/periods/')

export function Periods() {
  const [settings, setSettings] = useState<AcademicSettings>({
    periodCount: 3,
    periodWeights: { 1: 30, 2: 30, 3: 40 }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDefault, setIsDefault] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const result = await getAcademicSettings()
      setSettings(result.settings)
      setIsDefault(result.isDefault)
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Validate that weights sum to 100
      const totalWeight = Object.values(settings.periodWeights).reduce((sum, weight) => sum + weight, 0)
      if (totalWeight !== 100) {
        toast.error('Los porcentajes deben sumar 100%')
        return
      }

      await saveAcademicSettings(settings)
      setIsDefault(false)
      toast.success('Configuración guardada exitosamente')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handlePeriodCountChange = (count: number) => {
    const newWeights: { [key: number]: number } = {}
    const equalWeight = Math.floor(100 / count)
    const remainder = 100 % count

    for (let i = 1; i <= count; i++) {
      newWeights[i] = equalWeight + (i <= remainder ? 1 : 0)
    }

    setSettings({
      periodCount: count,
      periodWeights: newWeights
    })
  }

  const handleWeightChange = (period: number, weight: number) => {
    setSettings(prev => ({
      ...prev,
      periodWeights: {
        ...prev.periodWeights,
        [period]: weight
      }
    }))
  }

  const getTotalWeight = () => {
    return Object.values(settings.periodWeights).reduce((sum, weight) => sum + weight, 0)
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
          <PeriodsSkeleton />
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
            <h2 className='text-2xl font-bold tracking-tight'>Configuración de Periodos</h2>
            <p className='text-muted-foreground'>
              Define el número de periodos académicos y sus porcentajes de evaluación.
            </p>
          </div>
          <div className='flex gap-2'>
            {isDefault && (
              <Badge variant='outline' className='text-orange-600 border-orange-600'>
                Configuración por defecto
              </Badge>
            )}
            <Button onClick={handleSave} disabled={saving}>
              <Save className='mr-2 h-4 w-4' />
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </div>

        <div className='grid gap-6 md:grid-cols-1 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='h-5 w-5' />
                Número de Periodos
              </CardTitle>
              <CardDescription>
                Selecciona cuántos periodos académicos tendrá el año escolar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='period-count'>Número de Periodos</Label>
                  <Select
                    value={settings.periodCount.toString()}
                    onValueChange={(value) => handlePeriodCountChange(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Selecciona el número de periodos' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='2'>2 Periodos</SelectItem>
                      <SelectItem value='3'>3 Periodos</SelectItem>
                      <SelectItem value='4'>4 Periodos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Porcentajes</CardTitle>
              <CardDescription>
                Asigna el porcentaje que vale cada periodo en la calificación final.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {Array.from({ length: settings.periodCount }, (_, i) => i + 1).map((period) => (
                  <div key={period} className='flex items-center space-x-4'>
                    <Label htmlFor={`period-${period}`} className='min-w-24'>
                      Periodo {period}
                    </Label>
                    <div className='flex items-center space-x-2 flex-1'>
                      <Input
                        id={`period-${period}`}
                        type='number'
                        min='0'
                        max='100'
                        value={settings.periodWeights[period]}
                        onChange={(e) => handleWeightChange(period, parseInt(e.target.value) || 0)}
                        className='w-20'
                      />
                      <span className='text-sm text-muted-foreground'>%</span>
                    </div>
                  </div>
                ))}
                <div className='pt-4 border-t'>
                  <div className='flex justify-between items-center'>
                    <span className='font-medium'>Total:</span>
                    <span className={`font-bold ${getTotalWeight() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {getTotalWeight()}%
                    </span>
                  </div>
                  {getTotalWeight() !== 100 && (
                    <p className='text-sm text-red-600 mt-2'>
                      Los porcentajes deben sumar exactamente 100%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
            <CardDescription>
              Así se distribuirán las calificaciones finales:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              {Array.from({ length: settings.periodCount }, (_, i) => i + 1).map((period) => (
                <div key={period} className='text-center p-4 border rounded-lg'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {settings.periodWeights[period]}%
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Periodo {period}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}

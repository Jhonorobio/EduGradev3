import { supabase } from '@/services/supabase'

export interface PerformanceRange {
  name: string
  min: number
  max: number
}

export interface PerformanceScale {
  bajo: PerformanceRange
  basico: PerformanceRange
  alto: PerformanceRange
  superior: PerformanceRange
}

export interface ColegioSettings {
  id: string
  colegio_id: string
  period_count: number
  period_weights: Record<string, number>
  category_weights: Record<string, number>
  escala_calificacion: '1-5' | '1-10'
  activity_types: {
    apuntes_tareas: string[]
    talleres_exposiciones: string[]
  }
  performance_scale?: PerformanceScale
  created_at: string
  updated_at: string
}

export interface CategoryWeight {
  apuntes_tareas: number
  talleres_exposiciones: number
  actitudinal: number
  evaluacion: number
}

// Get colegio settings by colegio ID
export async function getColegioSettings(
  colegioId: string
): Promise<ColegioSettings> {
  try {
    const { data, error } = await supabase
      .from('colegio_settings')
      .select('*')
      .eq('colegio_id', colegioId)
      .single()

    if (error) {
      // If no settings found, return default settings
      if (error.code === 'PGRST116') {
        console.log('No settings found for colegio, using defaults')
        return {
          id: '',
          colegio_id: colegioId,
          period_count: 3,
          period_weights: {
            '1': 30,
            '2': 30,
            '3': 40,
          },
          category_weights: {
            apuntes_tareas: 20,
            talleres_exposiciones: 20,
            actitudinal: 20,
            evaluacion: 40,
          },
          escala_calificacion: '1-10',
          activity_types: {
            apuntes_tareas: [
              'Tarea',
              'Investigación',
              'Resumen',
              'Mapa conceptual',
            ],
            talleres_exposiciones: [
              'Taller práctico',
              'Exposición oral',
              'Demostración',
              'Proyecto',
            ],
          },
          performance_scale: {
            bajo: { name: 'Bajo', min: 1, max: 5.9 },
            basico: { name: 'Básico', min: 6, max: 7.9 },
            alto: { name: 'Alto', min: 8, max: 9.4 },
            superior: { name: 'Superior', min: 9.5, max: 10 },
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }
      console.error('Error fetching colegio settings:', error)
      throw new Error('Error al cargar la configuración del colegio')
    }

    return data
  } catch (error) {
    console.error('Unexpected error fetching colegio settings:', error)
    throw new Error('Error inesperado al cargar la configuración del colegio')
  }
}

// Update colegio settings
export async function updateColegioSettings(
  colegioId: string,
  settings: Partial<ColegioSettings>
): Promise<ColegioSettings> {
  try {
    // Check if this is a new configuration (no id)
    const existingSettings = await getColegioSettings(colegioId)

    if (!existingSettings.id) {
      // Create new configuration - don't include id field
      const settingsToInsert = {
        colegio_id: colegioId,
        period_count: settings.period_count,
        period_weights: settings.period_weights,
        category_weights: settings.category_weights,
        escala_calificacion: settings.escala_calificacion,
        activity_types: settings.activity_types,
        performance_scale: settings.performance_scale,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('colegio_settings')
        .insert(settingsToInsert)
        .select()
        .single()

      if (error) {
        console.error('Error creating colegio settings:', error)
        throw new Error(
          `Error al crear la configuración del colegio: ${error.message}`
        )
      }

      return data
    } else {
      // Update existing configuration
      const { data, error } = await supabase
        .from('colegio_settings')
        .upsert({
          id: existingSettings.id,
          colegio_id: colegioId,
          period_count: settings.period_count,
          period_weights: settings.period_weights,
          category_weights: settings.category_weights,
          escala_calificacion: settings.escala_calificacion,
          activity_types: settings.activity_types,
          performance_scale: settings.performance_scale,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating colegio settings:', error)
        throw new Error(
          `Error al actualizar la configuración del colegio: ${error.message}`
        )
      }

      return data
    }
  } catch (error) {
    console.error('Unexpected error updating colegio settings:', error)
    throw new Error(
      'Error inesperado al actualizar la configuración del colegio'
    )
  }
}

// Get default settings for new colegio
export function getDefaultColegioSettings(): Omit<
  ColegioSettings,
  'id' | 'colegio_id' | 'created_at' | 'updated_at'
> {
  return {
    period_count: 3,
    period_weights: {
      '1': 30,
      '2': 30,
      '3': 40,
    },
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
    performance_scale: {
      bajo: { name: 'Bajo', min: 1, max: 5.9 },
      basico: { name: 'Básico', min: 6, max: 7.9 },
      alto: { name: 'Alto', min: 8, max: 9.4 },
      superior: { name: 'Superior', min: 9.5, max: 10 },
    },
  }
}

// Calculate weighted average using colegio-specific settings
// La nota final es la suma de: (nota de categoría × peso / 100)
export function calculateWeightedAverage(
  categoryScores: Record<string, number>,
  settings: ColegioSettings
): number {
  const { category_weights } = settings

  let totalScore = 0

  Object.entries(category_weights).forEach(([category, weight]) => {
    const score = categoryScores[category] || 0
    // Nota final = suma de (nota × peso / 100)
    totalScore += (score * weight) / 100
  })

  return Math.round(totalScore * 100) / 100
}

// Validate settings structure
export function validateColegioSettings(
  settings: Partial<ColegioSettings>
): string[] {
  const errors: string[] = []

  if (settings.period_count !== undefined && settings.period_count <= 0) {
    errors.push('El número de períodos debe ser mayor a 0')
  }

  if (settings.period_weights) {
    const totalWeight = Object.values(settings.period_weights).reduce(
      (sum, weight) => sum + weight,
      0
    )
    if (Math.abs(totalWeight - 100) > 0.01) {
      errors.push('La suma de los pesos de los períodos debe ser 100')
    }
  }

  if (settings.category_weights) {
    const totalWeight = Object.values(settings.category_weights).reduce(
      (sum, weight) => sum + weight,
      0
    )
    if (Math.abs(totalWeight - 100) > 0.01) {
      errors.push('La suma de los pesos de las categorías debe ser 100')
    }
  }

  return errors
}

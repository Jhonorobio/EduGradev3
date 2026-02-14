import { supabase, isSupabaseConfigured } from './supabase'

export interface AcademicSettings {
  periodCount: number
  periodWeights: { [key: number]: number }
}

const DEFAULT_ACADEMIC_SETTINGS: AcademicSettings = {
  periodCount: 3,
  periodWeights: { 1: 30, 2: 30, 3: 40 },
}

export async function getAcademicSettings(): Promise<{ settings: AcademicSettings, isDefault: boolean }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { settings: DEFAULT_ACADEMIC_SETTINGS, isDefault: true }
  }

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error fetching academic settings:', error)
    return { settings: DEFAULT_ACADEMIC_SETTINGS, isDefault: true }
  }

  if (!data) {
    return { settings: DEFAULT_ACADEMIC_SETTINGS, isDefault: true }
  }

  return {
    settings: {
      periodCount: data.period_count,
      periodWeights: data.period_weights,
    },
    isDefault: false
  }
}

export async function saveAcademicSettings(settings: AcademicSettings) {
  if (!isSupabaseConfigured() || !supabase) {
    console.log("Demo mode: saving settings", settings)
    return
  }

  try {
    // Use upsert with a fixed approach - delete all existing settings first, then insert new one
    console.log('Saving settings:', settings)
    
    // First, delete any existing settings
    const { error: deleteError } = await supabase
      .from('settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // This will match all rows

    if (deleteError) {
      console.log('No existing settings to delete or delete error:', deleteError)
    }

    // Then insert the new settings
    const { data, error } = await supabase
      .from('settings')
      .insert({
        period_count: settings.periodCount,
        period_weights: settings.periodWeights
      })
      .select()

    if (error) {
      console.error('Error inserting academic settings:', error)
      throw new Error(`Error al guardar la configuración académica: ${error.message}`)
    }
    
    console.log('Settings saved successfully:', data)
  } catch (error) {
    console.error('Unexpected error in saveAcademicSettings:', error)
    throw new Error('Error inesperado al guardar la configuración académica')
  }
}

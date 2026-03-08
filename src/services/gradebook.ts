import { supabase } from '@/services/supabase'
import { getColegioSettings, calculateWeightedAverage } from '@/services/colegio-settings'

export interface Activity {
  id: string
  name: string
  category: 'apuntes_tareas' | 'talleres_exposiciones' | 'actitudinal' | 'evaluacion'
  max_score: number
  description?: string
  subject_id: string
  grade_id: string
  teacher_id: string
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  name: string
  last_name?: string
  enrollment_number?: string
  grade_level_id: string
  created_at: string
  updated_at: string
}

export interface GradebookEntry {
  id: string
  student_id: string
  activity_id: string
  score?: number
  comments?: string
  graded_at?: string
  graded_by?: string
  created_at: string
  updated_at: string
}

export interface GradebookData {
  students: Student[]
  activities: Activity[]
  grades: Record<string, Record<string, number>>
}

// Activity management
export async function getActivities(subjectId: string, gradeId: string): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('grade_id', gradeId)
      .order('category', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching activities:', error)
      throw new Error('Error al cargar las actividades')
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching activities:', error)
    throw new Error('Error inesperado al cargar las actividades')
  }
}

export async function createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert(activity)
      .select()
      .single()

    if (error) {
      console.error('Error creating activity:', error)
      throw new Error(`Error al crear la actividad: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Unexpected error creating activity:', error)
    throw new Error('Error inesperado al crear la actividad')
  }
}

export async function updateActivity(id: string, activity: Partial<Activity>): Promise<Activity> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .update(activity)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating activity:', error)
      throw new Error(`Error al actualizar la actividad: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Unexpected error updating activity:', error)
    throw new Error('Error inesperado al actualizar la actividad')
  }
}

export async function deleteActivity(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting activity:', error)
      throw new Error(`Error al eliminar la actividad: ${error.message}`)
    }
  } catch (error) {
    console.error('Unexpected error deleting activity:', error)
    throw new Error('Error inesperado al eliminar la actividad')
  }
}

// Student management
export async function getStudentsByGrade(gradeId: string): Promise<Student[]> {
  try {
    const { data, error } = await supabase
      .from('alumnos')
      .select(`
        id,
        name,
        last_name,
        grade_id,
        status,
        created_at,
        updated_at
      `)
      .eq('grade_id', gradeId)
      .eq('status', 'active')
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Error fetching students:', error)
      throw new Error('Error al cargar los estudiantes')
    }

    // Transform the data to match the Student interface
    return (data || []).map(alumno => ({
      id: alumno.id,
      name: alumno.name,
      last_name: alumno.last_name,
      enrollment_number: undefined,
      grade_level_id: alumno.grade_id,
      created_at: alumno.created_at,
      updated_at: alumno.updated_at
    }))
  } catch (error) {
    console.error('Unexpected error fetching students:', error)
    throw new Error('Error inesperado al cargar los estudiantes')
  }
}

export async function createStudent(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> {
  try {
    // Transform the Student interface to match alumnos table
    const alumnoData = {
      name: student.name,
      last_name: student.last_name,
      colegio_id: '', // This would need to be provided or handled
      grade_id: student.grade_level_id,
      status: 'active'
    }

    const { data, error } = await supabase
      .from('alumnos')
      .insert(alumnoData)
      .select(`
        id,
        name,
        last_name,
        grade_id,
        status,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      console.error('Error creating student:', error)
      throw new Error(`Error al crear el estudiante: ${error.message}`)
    }

    // Transform back to Student interface
    return {
      id: data.id,
      name: data.name,
      last_name: data.last_name,
      enrollment_number: undefined,
      grade_level_id: data.grade_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  } catch (error) {
    console.error('Unexpected error creating student:', error)
    throw new Error('Error inesperado al crear el estudiante')
  }
}

// Gradebook entries management
export async function getGradebookEntries(activityIds: string[]): Promise<GradebookEntry[]> {
  try {
    const { data, error } = await supabase
      .from('gradebook_entries')
      .select('*')
      .in('activity_id', activityIds)

    if (error) {
      console.error('Error fetching gradebook entries:', error)
      throw new Error('Error al cargar las calificaciones')
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching gradebook entries:', error)
    throw new Error('Error inesperado al cargar las calificaciones')
  }
}

export async function upsertGradebookEntry(entry: {
  student_id: string
  activity_id: string
  score?: number
  comments?: string
  graded_by?: string
}): Promise<GradebookEntry> {
  try {
    const { data, error } = await supabase
      .from('gradebook_entries')
      .upsert({
        ...entry,
        graded_at: entry.score !== undefined ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id,activity_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting gradebook entry:', error)
      throw new Error(`Error al guardar la calificación: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Unexpected error upserting gradebook entry:', error)
    throw new Error('Error inesperado al guardar la calificación')
  }
}

export async function deleteGradebookEntry(studentId: string, activityId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('gradebook_entries')
      .delete()
      .eq('student_id', studentId)
      .eq('activity_id', activityId)

    if (error) {
      console.error('Error deleting gradebook entry:', error)
      throw new Error(`Error al eliminar la calificación: ${error.message}`)
    }
  } catch (error) {
    console.error('Unexpected error deleting gradebook entry:', error)
    throw new Error('Error inesperado al eliminar la calificación')
  }
}

// Get complete gradebook data with colegio-specific settings
export async function getGradebookData(subjectId: string, gradeId: string): Promise<GradebookData> {
  try {
    const [students, activities] = await Promise.all([
      getStudentsByGrade(gradeId),
      getActivities(subjectId, gradeId)
    ])

    const activityIds = activities.map(a => a.id)
    const entries = activityIds.length > 0 ? await getGradebookEntries(activityIds) : []

    // Transform entries array to grades object format
    const grades: Record<string, Record<string, number>> = {}
    entries.forEach(entry => {
      if (!grades[entry.student_id]) {
        grades[entry.student_id] = {}
      }
      grades[entry.student_id][entry.activity_id] = entry.score || 0
    })

    return {
      students,
      activities,
      grades
    }
  } catch (error) {
    console.error('Error fetching gradebook data:', error)
    throw new Error('Error al cargar los datos de la planilla')
  }
}

// Get colegio ID from a student
export async function getColegioIdFromStudent(studentId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('alumnos')
      .select('colegio_id')
      .eq('id', studentId)
      .single()

    if (error) {
      console.error('Error fetching colegio ID:', error)
      throw new Error('Error al obtener el colegio del estudiante')
    }

    return data.colegio_id
  } catch (error) {
    console.error('Unexpected error fetching colegio ID:', error)
    throw new Error('Error inesperado al obtener el colegio del estudiante')
  }
}

// Calculate student average using colegio-specific settings
// Para categorías con múltiples actividades: promedio de actividades
// Para categorías de nota única: usar la nota directamente
// La nota final = suma de (nota categoría × peso / 100)
export async function calculateStudentAverage(
  studentId: string, 
  activities: Activity[], 
  grades: Record<string, Record<string, number>>
): Promise<number> {
  try {
    // Get colegio ID from student
    const colegioId = await getColegioIdFromStudent(studentId)
    
    // Get colegio settings (includes escala_calificacion)
    const settings = await getColegioSettings(colegioId)
    
    // Get max score based on scale (1-5 or 1-10)
    const maxScoreScale = settings.escala_calificacion === '1-5' ? 5 : 10
    
    // Calculate category averages or direct scores
    const categoryScores: Record<string, number> = {}
    
    Object.entries(settings.category_weights).forEach(([category]) => {
      const categoryActivities = activities.filter(a => a.category === category)
      
      if (categoryActivities.length === 0) {
        categoryScores[category] = 0
        console.log(`  -> No activities, score = 0`)
        return
      }
      
      // Get scores for ALL activities in this category (0 if no grade)
      const scores = categoryActivities.map(activity => {
        const score = grades[studentId]?.[activity.id] || 0
        // Normalizar a escala de 10
        return (score / maxScoreScale) * 10
      })
      
      // Promedio de TODAS las actividades (incluyendo las sin nota como 0)
      const totalScore = scores.reduce((sum, s) => sum + s, 0)
      categoryScores[category] = Math.round((totalScore / scores.length) * 100) / 100
    })
    
    // Use colegio-specific weighted calculation
    return calculateWeightedAverage(categoryScores, settings)
  } catch (error) {
    console.error('Error calculating student average:', error)
    return 0
  }
}

// Get colegio settings for gradebook
export async function getGradebookSettings(studentId: string) {
  try {
    const colegioId = await getColegioIdFromStudent(studentId)
    return await getColegioSettings(colegioId)
  } catch (error) {
    console.error('Error getting gradebook settings:', error)
    throw new Error('Error al obtener la configuración de la planilla')
  }
}

import { supabase } from '@/services/supabase'
import { sortGradesEducationally } from '@/utils/grade-ordering'

export interface GradeDirectorInfo {
  id: string
  name: string
  level: 'Preescolar' | 'Primaria' | 'Bachillerato'
  colegio_id?: string
}

/**
 * Gets the grade where a teacher is assigned as group director
 * The group_director column stores teacher names (e.g., "Prof. Juan Pérez")
 * Returns null if the teacher is not a director of any grade
 */
export async function getGradeByDirectorName(
  teacherName: string,
  colegioId?: string
): Promise<GradeDirectorInfo | null> {
  if (!supabase) {
    throw new Error('Supabase no está configurado')
  }

  try {
    // Query by teacher name - group_director stores names like "Prof. Emily Asprilla"
    // We fetch grades with directors and filter client-side for better matching
    let query = supabase
      .from('grades')
      .select('id, name, level, colegio_id, group_director')
      .not('group_director', 'is', null)
      .limit(50)

    // Filter by colegio if provided
    if (colegioId) {
      query = query.eq('colegio_id', colegioId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching grade by director:', error)
      throw new Error(`Error al cargar el grado: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return null
    }

    // Find the grade where this teacher is director
    // Match by checking if the stored name contains the teacher's name
    const grade = data.find((g: any) => {
      const directorName = (g.group_director || '').toLowerCase()
      const searchName = teacherName.toLowerCase()
      return directorName.includes(searchName) || searchName.includes(directorName)
    })

    if (!grade) {
      return null
    }

    return {
      id: grade.id,
      name: grade.name,
      level: grade.level,
      colegio_id: grade.colegio_id,
    }
  } catch (error) {
    console.error('Unexpected error fetching grade by director:', error)
    throw new Error('Error inesperado al cargar el grado del director')
  }
}

/**
 * Gets all grades where a teacher is assigned as group director
 * The group_director column stores teacher names (e.g., "Prof. Juan Pérez")
 * Returns empty array if the teacher is not a director of any grade
 */
export async function getGradesByDirectorName(
  teacherName: string,
  colegioId?: string
): Promise<GradeDirectorInfo[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado')
  }

  try {
    // Query by teacher name - group_director stores names like "Prof. Emily Asprilla"
    // We fetch grades with directors and filter client-side for better matching
    let query = supabase
      .from('grades')
      .select('id, name, level, colegio_id, group_director')
      .not('group_director', 'is', null)
      .limit(50)

    // Filter by colegio if provided
    if (colegioId) {
      query = query.eq('colegio_id', colegioId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching grades by director:', error)
      throw new Error(`Error al cargar los grados: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return []
    }

    // Filter grades where this teacher is director
    // Match by checking if the stored name contains the teacher's name
    const searchName = teacherName.toLowerCase()
    const grades = data
      .filter((g: any) => {
        const directorName = (g.group_director || '').toLowerCase()
        return directorName.includes(searchName) || searchName.includes(directorName)
      })
      .map((grade: any) => ({
        id: grade.id,
        name: grade.name,
        level: grade.level,
        colegio_id: grade.colegio_id,
      }))

    // Sort grades educationally
    return sortGradesEducationally(grades)
  } catch (error) {
    console.error('Unexpected error fetching grades by director:', error)
    throw new Error('Error inesperado al cargar los grados del director')
  }
}

/**
 * Checks if a teacher is a group director of any grade
 */
export async function isGroupDirector(
  teacherName: string,
  colegioId?: string
): Promise<boolean> {
  try {
    const grade = await getGradeByDirectorName(teacherName, colegioId)
    return grade !== null
  } catch {
    return false
  }
}

// Keep old function names for backward compatibility (deprecated)
export async function getGradeByDirector(
  teacherId: string,
  colegioId?: string
): Promise<GradeDirectorInfo | null> {
  return getGradeByDirectorName(teacherId, colegioId)
}

export async function getGradesByDirector(
  teacherId: string,
  colegioId?: string
): Promise<GradeDirectorInfo[]> {
  return getGradesByDirectorName(teacherId, colegioId)
}

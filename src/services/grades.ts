import { supabase } from '@/services/supabase'

export interface Grade {
  id: string
  name: string
  level: 'Preescolar' | 'Primaria' | 'Bachillerato'
  groupDirector: string
  created_at?: string
  updated_at?: string
}

export async function getGrades(): Promise<Grade[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado')
  }

  try {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching grades:', error)
      throw new Error(`Error al cargar los grados: ${error.message}`)
    }

    // Convertir snake_case a camelCase para la respuesta
    return (data || []).map((grade: any) => ({
      ...grade,
      groupDirector: grade.group_director
    }))
  } catch (error) {
    console.error('Unexpected error fetching grades:', error)
    throw new Error('Error inesperado al cargar los grados')
  }
}

export async function createGrade(grade: Omit<Grade, 'id' | 'created_at' | 'updated_at'>): Promise<Grade> {
  if (!supabase) {
    throw new Error('Supabase no está configurado')
  }

  try {
    // Convertir camelCase a snake_case para la base de datos
    const dbGrade = {
      name: grade.name,
      level: grade.level,
      group_director: grade.groupDirector || null // Permitir null si no hay director
    }

    const { data, error } = await supabase
      .from('grades')
      .insert(dbGrade)
      .select()
      .single()

    if (error) {
      console.error('Error creating grade:', error)
      throw new Error(`Error al crear el grado: ${error.message}`)
    }

    // Convertir snake_case a camelCase para la respuesta
    return {
      ...data,
      groupDirector: data.group_director
    }
  } catch (error) {
    console.error('Unexpected error creating grade:', error)
    throw new Error('Error inesperado al crear el grado')
  }
}

export async function updateGrade(id: string, grade: Partial<Grade>): Promise<Grade> {
  if (!supabase) {
    throw new Error('Supabase no está configurado')
  }

  try {
    // Convertir camelCase a snake_case para la base de datos
    const dbGrade: any = {}
    if (grade.name !== undefined) dbGrade.name = grade.name
    if (grade.level !== undefined) dbGrade.level = grade.level
    if (grade.groupDirector !== undefined) dbGrade.group_director = grade.groupDirector || null

    const { data, error } = await supabase
      .from('grades')
      .update(dbGrade)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating grade:', error)
      throw new Error(`Error al actualizar el grado: ${error.message}`)
    }

    // Convertir snake_case a camelCase para la respuesta
    return {
      ...data,
      groupDirector: data.group_director
    }
  } catch (error) {
    console.error('Unexpected error updating grade:', error)
    throw new Error('Error inesperado al actualizar el grado')
  }
}

export async function deleteGrade(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado')
  }

  try {
    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting grade:', error)
      throw new Error(`Error al eliminar el grado: ${error.message}`)
    }
  } catch (error) {
    console.error('Unexpected error deleting grade:', error)
    throw new Error('Error inesperado al eliminar el grado')
  }
}

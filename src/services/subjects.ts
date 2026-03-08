import { supabase } from '@/services/supabase'

export interface Subject {
  id: string
  name: string
  code: string
  levels: ('Primaria' | 'Bachillerato')[]
  colegio_id: string
  created_at?: string
  updated_at?: string
}

export async function getSubjects(colegioId?: string): Promise<Subject[]> {
  try {
    let query = supabase
      .from('subjects')
      .select('*')
      .order('name')

    // If colegioId is provided, filter by it
    if (colegioId) {
      query = query.eq('colegio_id', colegioId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching subjects:', error)
      throw new Error('Error al cargar las materias')
    }

    return (data || []).map((subject: any) => ({
      ...subject,
      levels: subject.levels || []
    }))
  } catch (error) {
    console.error('Unexpected error fetching subjects:', error)
    throw new Error('Error inesperado al cargar las materias')
  }
}

export async function getSubjectsByColegio(colegioId: string): Promise<Subject[]> {
  return getSubjects(colegioId)
}

export async function createSubject(subject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<Subject> {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subject)
      .select()
      .single()

    if (error) {
      console.error('Error creating subject:', error)
      throw new Error(`Error al crear la materia: ${error.message}`)
    }

    return {
      ...data,
      levels: data.levels || []
    }
  } catch (error) {
    console.error('Unexpected error creating subject:', error)
    throw new Error('Error inesperado al crear la materia')
  }
}

export async function updateSubject(id: string, subject: Partial<Subject>): Promise<Subject> {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .update(subject)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating subject:', error)
      throw new Error(`Error al actualizar la materia: ${error.message}`)
    }

    return {
      ...data,
      levels: data.levels || []
    }
  } catch (error) {
    console.error('Unexpected error updating subject:', error)
    throw new Error('Error inesperado al actualizar la materia')
  }
}

export async function deleteSubject(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting subject:', error)
      throw new Error(`Error al eliminar la materia: ${error.message}`)
    }
  } catch (error) {
    console.error('Unexpected error deleting subject:', error)
    throw new Error('Error inesperado al eliminar la materia')
  }
}

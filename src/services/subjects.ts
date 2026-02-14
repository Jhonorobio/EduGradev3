import { supabase, isSupabaseConfigured } from '@/services/supabase'

export interface Subject {
  id: string
  name: string
  code: string
  levels: ('Primaria' | 'Bachillerato')[]
  created_at?: string
  updated_at?: string
}

const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: '1',
    name: 'Matemáticas',
    code: 'MAT101',
    levels: ['Primaria', 'Bachillerato']
  },
  {
    id: '2',
    name: 'Español',
    code: 'ESP101',
    levels: ['Primaria', 'Bachillerato']
  },
  {
    id: '3',
    name: 'Ciencias',
    code: 'CIE101',
    levels: ['Primaria']
  },
  {
    id: '4',
    name: 'Historia',
    code: 'HIS101',
    levels: ['Bachillerato']
  },
  {
    id: '5',
    name: 'Educación Física',
    code: 'EDF101',
    levels: ['Primaria']
  },
  {
    id: '6',
    name: 'Filosofía',
    code: 'FIL101',
    levels: ['Bachillerato']
  },
  {
    id: '7',
    name: 'Inglés',
    code: 'ING101',
    levels: ['Primaria', 'Bachillerato']
  },
  {
    id: '8',
    name: 'Arte',
    code: 'ART101',
    levels: ['Primaria']
  }
]

export async function getSubjects(): Promise<Subject[]> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log("Demo mode: using default subjects")
    return DEFAULT_SUBJECTS
  }

  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching subjects:', error)
      return DEFAULT_SUBJECTS
    }

    // Asegurar que los datos tengan el formato correcto
    const formattedData = (data || []).map(subject => ({
      ...subject,
      levels: Array.isArray(subject.levels) ? subject.levels : []
    }))

    return formattedData.length > 0 ? formattedData : DEFAULT_SUBJECTS
  } catch (error) {
    console.error('Unexpected error fetching subjects:', error)
    return DEFAULT_SUBJECTS
  }
}

export async function createSubject(subject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<Subject> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log("Demo mode: creating subject", subject)
    const newSubject: Subject = {
      ...subject,
      id: Date.now().toString()
    }
    DEFAULT_SUBJECTS.push(newSubject)
    return newSubject
  }

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

    return data
  } catch (error) {
    console.error('Unexpected error creating subject:', error)
    throw new Error('Error inesperado al crear la materia')
  }
}

export async function updateSubject(id: string, subject: Partial<Subject>): Promise<Subject> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log("Demo mode: updating subject", id, subject)
    const index = DEFAULT_SUBJECTS.findIndex(s => s.id === id)
    if (index !== -1) {
      DEFAULT_SUBJECTS[index] = { ...DEFAULT_SUBJECTS[index], ...subject }
      return DEFAULT_SUBJECTS[index]
    }
    throw new Error('Materia no encontrada')
  }

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

    return data
  } catch (error) {
    console.error('Unexpected error updating subject:', error)
    throw new Error('Error inesperado al actualizar la materia')
  }
}

export async function deleteSubject(id: string): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log("Demo mode: deleting subject", id)
    const index = DEFAULT_SUBJECTS.findIndex(s => s.id === id)
    if (index !== -1) {
      DEFAULT_SUBJECTS.splice(index, 1)
    }
    return
  }

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

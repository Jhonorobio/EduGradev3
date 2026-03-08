import { supabase } from '@/services/supabase'

export interface Alumno {
  id: string
  name: string
  last_name: string
  colegio_id: string
  colegio_name: string
  grade_id: string
  grade_name: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at?: string
}

export async function getAlumnos(): Promise<Alumno[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado')
  }

  try {
    const { data, error } = await supabase
      .from('alumnos')
      .select(`
        id,
        name,
        last_name,
        colegio_id,
        colegios!inner(name, code),
        grades!inner(name, level),
        status,
        created_at,
        updated_at
      `)
      .order('name')

    if (error) {
      console.error('Error fetching alumnos:', error)
      throw new Error(`Error al cargar los alumnos: ${error.message}`)
    }

    return (data || []).map((alumno: any) => ({
      id: alumno.id,
      name: alumno.name,
      last_name: alumno.last_name,
      colegio_id: alumno.colegio_id,
      colegio_name: alumno.colegios?.name || 'Colegio Desconocido',
      grade_id: alumno.grades?.id || 'Grado Desconocido',
      grade_name: alumno.grades?.name || 'Grado Desconocido',
      status: alumno.status,
      created_at: alumno.created_at,
      updated_at: alumno.updated_at,
    }))
  } catch (error) {
    console.error('Unexpected error fetching alumnos:', error)
    throw new Error('Error inesperado al cargar los alumnos')
  }
}

export async function getAlumnosByColegio(colegioId: string): Promise<Alumno[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado')
  }

  try {
    const { data, error } = await supabase
      .from('alumnos')
      .select(`
        id,
        name,
        last_name,
        colegio_id,
        colegios!inner(name, code),
        grades!inner(name, level),
        status,
        created_at,
        updated_at
      `)
      .eq('colegio_id', colegioId)
      .order('name')

    if (error) {
      console.error('Error fetching alumnos:', error)
      throw new Error(`Error al cargar los alumnos: ${error.message}`)
    }

    return (data || []).map((alumno: any) => ({
      id: alumno.id,
      name: alumno.name,
      last_name: alumno.last_name,
      colegio_id: alumno.colegio_id,
      colegio_name: alumno.colegios?.name || 'Colegio Desconocido',
      grade_id: alumno.grades?.id || 'Grado Desconocido',
      grade_name: alumno.grades?.name || 'Grado Desconocido',
      status: alumno.status,
      created_at: alumno.created_at,
      updated_at: alumno.updated_at,
    }))
  } catch (error) {
    console.error('Unexpected error fetching alumnos:', error)
    throw new Error('Error inesperado al cargar los alumnos')
  }
}

export async function createAlumno(alumno: Omit<Alumno, 'id' | 'created_at' | 'updated_at'>): Promise<Alumno> {
  if (!supabase) {
    throw new Error('Supabase no está configurado')
  }

  try {
    const { data, error } = await supabase
      .from('alumnos')
      .insert({
        name: alumno.name,
        last_name: alumno.last_name,
        colegio_id: alumno.colegio_id,
        grade_id: alumno.grade_id,
        status: alumno.status,
      })
      .select(`
        id,
        name,
        last_name,
        colegio_id,
        colegios!inner(name, code),
        grades!inner(name, level),
        status,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      console.error('Error creating alumno:', error)
      throw new Error(`Error al crear el alumno: ${error.message}`)
    }

    // Formatear la respuesta
    return {
      id: data.id,
      name: data.name,
      last_name: data.last_name,
      colegio_id: data.colegio_id,
      colegio_name: data.colegios?.name || 'Colegio Desconocido',
      grade_id: data.grades?.id || 'Grado Desconocido',
      grade_name: data.grades?.name || 'Grado Desconocido',
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Unexpected error creating alumno:', error)
    throw new Error('Error inesperado al crear el alumno')
  }
}

export async function updateAlumno(id: string, alumno: Partial<Alumno>): Promise<Alumno> {
  if (!supabase) {
    throw new Error('Supabase no está configurado')
  }

  try {
    const updateData: any = {}
    if (alumno.name !== undefined) updateData.name = alumno.name
    if (alumno.last_name !== undefined) updateData.last_name = alumno.last_name
    if (alumno.colegio_id !== undefined) updateData.colegio_id = alumno.colegio_id
    if (alumno.grade_id !== undefined) updateData.grade_id = alumno.grade_id
    if (alumno.status !== undefined) updateData.status = alumno.status

    const { data, error } = await supabase
      .from('alumnos')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        name,
        last_name,
        colegio_id,
        colegios!inner(name, code),
        grades!inner(name, level),
        status,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      console.error('Error updating alumno:', error)
      throw new Error(`Error al actualizar el alumno: ${error.message}`)
    }

    // Formatear la respuesta
    return {
      id: data.id,
      name: data.name,
      last_name: data.last_name,
      colegio_id: data.colegio_id,
      colegio_name: data.colegios?.name || 'Colegio Desconocido',
      grade_id: data.grades?.id || 'Grado Desconocido',
      grade_name: data.grades?.name || 'Grado Desconocido',
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Unexpected error updating alumno:', error)
    throw new Error('Error inesperado al actualizar el alumno')
  }
}

export async function deleteAlumno(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado')
  }

  try {
    const { error } = await supabase
      .from('alumnos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting alumno:', error)
      throw new Error(`Error al eliminar el alumno: ${error.message}`)
    }
  } catch (error) {
    console.error('Unexpected error deleting alumno:', error)
    throw new Error('Error inesperado al eliminar el alumno')
  }
}

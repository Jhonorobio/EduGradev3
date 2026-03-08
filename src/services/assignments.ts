import { supabase } from '@/services/supabase'
import { sortGradesEducationally } from '@/utils/grade-ordering'

export interface Assignment {
  id: string
  teacher_id: string
  subject_id: string
  grade_id: string | null
  grade_ids: string[]
  colegio_id: string
  created_at: string
  updated_at: string
  // Joined fields
  teacher_name?: string
  subject_name?: string
  grade_name?: string
}

export async function getAssignments(colegioId?: string): Promise<Assignment[]> {
  try {
    let query = supabase
      .from('assignments')
      .select(`
        *,
        teacher:users(name),
        subject:subjects(name),
        grade:grades(name)
      `)
      .order('created_at', { ascending: false })

    // If colegioId is provided, filter by it
    if (colegioId) {
      query = query.eq('colegio_id', colegioId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching assignments:', error)
      throw new Error('Error al cargar las asignaciones')
    }

    return (data || []).map((assignment: any) => ({
      ...assignment,
      teacher_name: assignment.teacher?.name,
      subject_name: assignment.subject?.name,
      grade_name: assignment.grade?.name
    }))
  } catch (error) {
    console.error('Unexpected error fetching assignments:', error)
    throw new Error('Error inesperado al cargar las asignaciones')
  }
}

export async function createAssignment(assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at' | 'teacher_name' | 'subject_name' | 'grade_name'>): Promise<Assignment> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        teacher_id: assignment.teacher_id,
        subject_id: assignment.subject_id,
        grade_id: assignment.grade_id,
        colegio_id: assignment.colegio_id
      })
      .select(`
        *,
        teacher:users(name),
        subject:subjects(name),
        grade:grades(name)
      `)
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      throw new Error(`Error al crear la asignación: ${error.message}`)
    }

    return {
      id: data.id,
      teacher_id: data.teacher_id,
      subject_id: data.subject_id,
      grade_id: data.grade_id,
      grade_ids: data.grade_ids || [],
      colegio_id: data.colegio_id,
      teacher_name: data.teacher?.name || 'Sin profesor',
      subject_name: data.subject?.name || 'Sin materia',
      grade_name: data.grade?.name || 'Sin grado',
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  } catch (error) {
    console.error('Unexpected error creating assignment:', error)
    throw new Error('Error inesperado al crear la asignación')
  }
}

export async function updateAssignment(id: string, assignment: Partial<Assignment>): Promise<Assignment> {
  try {
    const updateData: any = {}
    if (assignment.teacher_id !== undefined) updateData.teacher_id = assignment.teacher_id
    if (assignment.subject_id !== undefined) updateData.subject_id = assignment.subject_id
    if (assignment.grade_id !== undefined) updateData.grade_id = assignment.grade_id
    if (assignment.grade_ids !== undefined) updateData.grade_ids = assignment.grade_ids
    if (assignment.colegio_id !== undefined) updateData.colegio_id = assignment.colegio_id

    const { data, error } = await supabase
      .from('assignments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        teacher:users(name),
        subject:subjects(name),
        grade:grades(name)
      `)
      .single()

    if (error) {
      console.error('Error updating assignment:', error)
      throw new Error(`Error al actualizar la asignación: ${error.message}`)
    }

    return {
      id: data.id,
      teacher_id: data.teacher_id,
      subject_id: data.subject_id,
      grade_id: data.grade_id,
      grade_ids: data.grade_ids || [],
      colegio_id: data.colegio_id,
      teacher_name: data.teacher?.name || 'Sin profesor',
      subject_name: data.subject?.name || 'Sin materia',
      grade_name: data.grade?.name || 'Sin grado',
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  } catch (error) {
    console.error('Unexpected error updating assignment:', error)
    throw new Error('Error inesperado al actualizar la asignación')
  }
}

export async function deleteAssignment(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting assignment:', error)
      throw new Error(`Error al eliminar la asignación: ${error.message}`)
    }
  } catch (error) {
    console.error('Unexpected error deleting assignment:', error)
    throw new Error('Error inesperado al eliminar la asignación')
  }
}

// Funciones auxiliares para el TeacherAssignmentManager
export async function getTeachers(): Promise<{ id: string; name: string }[]> {
  try {
    // Obtener todos los usuarios con sus roles
    const { data, error } = await supabase
      .from('users')
      .select('id, name, role')
      .order('name')

    if (error) {
      console.error('Error fetching teachers:', error)
      throw new Error('Error al cargar los profesores')
    }

    // Filtrar estrictamente solo roles de docentes/profesores
    const teachers = (data || []).filter(user => {
      const role = user.role?.toLowerCase()
      return role === 'professor' || role === 'docente' || role === 'teacher' || role === 'profesor'
    })

    return teachers
  } catch (error) {
    console.error('Unexpected error fetching teachers:', error)
    throw new Error('Error inesperado al cargar los profesores')
  }
}

export async function getSubjects(): Promise<{ id: string; name: string }[]> {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error fetching subjects:', error)
      throw new Error('Error al cargar las materias')
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching subjects:', error)
    throw new Error('Error inesperado al cargar las materias')
  }
}

export async function getGrades(): Promise<{ id: string; name: string }[]> {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error fetching grades:', error)
      throw new Error('Error al cargar los grados')
    }

    // Usar función global de ordenamiento educativo
    const sortedGrades = sortGradesEducationally(data || [])

    return sortedGrades
  } catch (error) {
    console.error('Unexpected error fetching grades:', error)
    throw new Error('Error inesperado al cargar los grados')
  }
}

export async function getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        teacher:users(name),
        subject:subjects(name),
        grade:grades(name)
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching teacher assignments:', error)
      throw new Error('Error al cargar las asignaciones del profesor')
    }

    return (data || []).map((assignment: any) => ({
      id: assignment.id,
      teacher_id: assignment.teacher_id,
      teacher_name: assignment.teacher?.name || 'Sin profesor',
      subject_id: assignment.subject_id,
      subject_name: assignment.subject?.name || 'Sin materia',
      grade_id: assignment.grade_id,
      grade_ids: assignment.grade_ids || [],
      grade_name: assignment.grade?.name || 'Sin grado',
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
      colegio_id: assignment.colegio_id
    }))
  } catch (error) {
    console.error('Unexpected error fetching teacher assignments:', error)
    throw new Error('Error inesperado al cargar las asignaciones del profesor')
  }
}

export async function getAssignmentsByColegio(colegioId: string): Promise<Assignment[]> {
  return getAssignments(colegioId)
}

import { supabase } from '@/services/supabase'

export interface SubjectInfo {
  id: string
  name: string
  teacher_id: string
  teacher_name: string
}

export interface GradeSubject {
  assignment_id: string
  subject: SubjectInfo
  teacher_name: string
}

/**
 * Gets all subjects assigned to a specific grade
 * Returns empty array if no subjects are assigned
 */
export async function getSubjectsByGrade(
  gradeId: string,
  colegioId?: string
): Promise<GradeSubject[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado')
  }

  try {
    // Query assignments for this grade
    let query = supabase
      .from('assignments')
      .select(`
        id,
        subject_id,
        teacher_id,
        subject:subjects(id, name),
        teacher:users(name),
        grade_ids,
        colegio_id
      `)

    // Filter by colegio if provided
    if (colegioId) {
      query = query.eq('colegio_id', colegioId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching subjects by grade:', error)
      throw new Error(`Error al cargar las materias: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return []
    }

    // Filter assignments that include this grade and map to subjects
    const subjects: GradeSubject[] = data
      .filter((assignment: any) => {
        // Check if grade_id matches or if grade_ids array includes this grade
        const gradeIds = assignment.grade_ids || []
        return assignment.grade_id === gradeId || gradeIds.includes(gradeId)
      })
      .map((assignment: any) => ({
        assignment_id: assignment.id,
        subject: {
          id: assignment.subject_id,
          name: assignment.subject?.name || 'Sin materia',
          teacher_id: assignment.teacher_id,
          teacher_name: assignment.teacher?.name || 'Sin profesor',
        },
        teacher_name: assignment.teacher?.name || 'Sin profesor',
      }))

    // Remove duplicates (same subject might have multiple assignments)
    const uniqueSubjects = subjects.filter(
      (subject, index, self) =>
        index === self.findIndex((s) => s.subject.id === subject.subject.id)
    )

    return uniqueSubjects
  } catch (error) {
    console.error('Unexpected error fetching subjects by grade:', error)
    throw new Error('Error inesperado al cargar las materias del grado')
  }
}

/**
 * Gets all teachers assigned to a specific grade
 */
export async function getTeachersByGrade(
  gradeId: string,
  colegioId?: string
): Promise<{ id: string; name: string; subject: string }[]> {
  const subjects = await getSubjectsByGrade(gradeId, colegioId)

  // Extract unique teachers
  const teachersMap = new Map<string, { id: string; name: string; subject: string }>()

  subjects.forEach((item) => {
    if (!teachersMap.has(item.subject.teacher_id)) {
      teachersMap.set(item.subject.teacher_id, {
        id: item.subject.teacher_id,
        name: item.subject.teacher_name,
        subject: item.subject.name,
      })
    }
  })

  return Array.from(teachersMap.values())
}

import { supabase } from './supabase';

export interface QualitativeReport {
  id: string;
  student_id: string;
  subject_id: string;
  grade_id: string;
  period: number;
  teacher_id: string;
  colegio_id: string;
  academic_year: number;
  activities_not_delivered: string;
  insufficient_activities: string;
  positive_notes: string;
  behavioral_issues: 'Sí' | 'No';
  attendance_issues: 'Sí' | 'No';
  personal_presentation: string;
  observations: string;
  status: 'draft' | 'submitted';
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    name: string;
    last_name: string;
  };
  subject?: {
    id: string;
    name: string;
  };
  grade?: {
    id: string;
    name: string;
  };
}

export interface CreateQualitativeReportDTO {
  student_id: string;
  subject_id: string;
  grade_id: string;
  period: number;
  teacher_id: string;
  colegio_id: string;
  academic_year?: number;
  activities_not_delivered?: string;
  insufficient_activities?: string;
  positive_notes?: string;
  behavioral_issues?: 'Sí' | 'No';
  attendance_issues?: 'Sí' | 'No';
  personal_presentation?: string;
  observations?: string;
  status?: 'draft' | 'submitted';
}

export interface UpdateQualitativeReportDTO {
  activities_not_delivered?: string;
  insufficient_activities?: string;
  positive_notes?: string;
  behavioral_issues?: 'Sí' | 'No';
  attendance_issues?: 'Sí' | 'No';
  personal_presentation?: string;
  observations?: string;
  status?: 'draft' | 'submitted';
}

export async function getQualitativeReports(
  filters: {
    subject_id?: string;
    grade_id?: string;
    period?: number;
    academic_year?: number;
  }
): Promise<QualitativeReport[]> {
  let query = supabase
    .from('qualitative_reports')
    .select(`
      *,
      student:alumnos(id, name, last_name),
      subject:subjects(id, name),
      grade:grades(id, name)
    `);

  if (filters.subject_id) {
    query = query.eq('subject_id', filters.subject_id);
  }
  if (filters.grade_id) {
    query = query.eq('grade_id', filters.grade_id);
  }
  if (filters.period) {
    query = query.eq('period', filters.period);
  }
  if (filters.academic_year) {
    query = query.eq('academic_year', filters.academic_year);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching qualitative reports:', error);
    throw error;
  }

  return data || [];
}

export async function getQualitativeReportById(id: string): Promise<QualitativeReport | null> {
  const { data, error } = await supabase
    .from('qualitative_reports')
    .select(`
      *,
      student:alumnos(id, name, last_name),
      subject:subjects(id, name),
      grade:grades(id, name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching qualitative report:', error);
    return null;
  }

  return data;
}

export async function createQualitativeReport(
  report: CreateQualitativeReportDTO
): Promise<QualitativeReport> {
  const { data, error } = await supabase
    .from('qualitative_reports')
    .insert([report])
    .select(`
      *,
      student:alumnos(id, name, last_name),
      subject:subjects(id, name),
      grade:grades(id, name)
    `)
    .single();

  if (error) {
    console.error('Error creating qualitative report:', error);
    throw error;
  }

  return data;
}

export async function updateQualitativeReport(
  id: string,
  report: UpdateQualitativeReportDTO
): Promise<QualitativeReport> {
  const { data, error } = await supabase
    .from('qualitative_reports')
    .update(report)
    .eq('id', id)
    .select(`
      *,
      student:alumnos(id, name, last_name),
      subject:subjects(id, name),
      grade:grades(id, name)
    `)
    .single();

  if (error) {
    console.error('Error updating qualitative report:', error);
    throw error;
  }

  return data;
}

export async function deleteQualitativeReport(id: string): Promise<void> {
  const { error } = await supabase
    .from('qualitative_reports')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting qualitative report:', error);
    throw error;
  }
}

// Enviar informes al director de grupo
export async function submitReportsToDirector(
  reports: CreateQualitativeReportDTO[]
): Promise<void> {
  if (reports.length === 0) return;

  // Actualizar todos los informes a status 'submitted'
  const updates = reports.map(async (report) => {
    // Buscar si existe un reporte para este estudiante/materia/periodo/año
    const { data: existing } = await supabase
      .from('qualitative_reports')
      .select('id')
      .eq('student_id', report.student_id)
      .eq('subject_id', report.subject_id)
      .eq('period', report.period)
      .eq('academic_year', report.academic_year || 2026)
      .maybeSingle();

    if (existing) {
      // Actualizar existente y marcar como enviado
      const { error } = await supabase
        .from('qualitative_reports')
        .update({
          activities_not_delivered: report.activities_not_delivered,
          insufficient_activities: report.insufficient_activities,
          positive_notes: report.positive_notes,
          behavioral_issues: report.behavioral_issues,
          attendance_issues: report.attendance_issues,
          personal_presentation: report.personal_presentation,
          observations: report.observations,
          status: 'submitted',
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Crear nuevo con status 'submitted'
      const { error } = await supabase
        .from('qualitative_reports')
        .insert([{
          ...report,
          status: 'submitted',
        }]);

      if (error) throw error;
    }
  });

  await Promise.all(updates);
}

// Obtener informes enviados para un grado (para el director)
export async function getSubmittedReportsForGrade(
  gradeId: string,
  period: number,
  academicYear?: number
): Promise<QualitativeReport[]> {
  const { data, error } = await supabase
    .from('qualitative_reports')
    .select(`
      *,
      student:alumnos(id, name, last_name),
      subject:subjects(id, name),
      grade:grades(id, name)
    `)
    .eq('grade_id', gradeId)
    .eq('period', period)
    .eq('academic_year', academicYear || 2026)
    .eq('status', 'submitted')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submitted reports:', error);
    throw error;
  }

  return data || [];
}

// Obtener informes enviados para un estudiante específico (para el director)
export async function getSubmittedReportsForStudent(
  studentId: string,
  period: number,
  academicYear?: number
): Promise<QualitativeReport[]> {
  console.log('Fetching reports for student:', studentId, 'period:', period, 'year:', academicYear || 2026);
  
  const { data, error } = await supabase
    .from('qualitative_reports')
    .select(`
      *,
      student:alumnos(id, name, last_name),
      subject:subjects!subject_id(id, name),
      grade:grades!grade_id(id, name)
    `)
    .eq('student_id', studentId)
    .eq('period', period)
    .eq('academic_year', academicYear || 2026)
    .eq('status', 'submitted');

  if (error) {
    console.error('Error fetching student reports:', error);
    throw error;
  }

  console.log('Raw data from Supabase:', data);
  return data || [];
}

export async function upsertQualitativeReport(
  report: CreateQualitativeReportDTO
): Promise<QualitativeReport> {
  // Check if report already exists for this student/subject/period/year
  const { data: existing } = await supabase
    .from('qualitative_reports')
    .select('id')
    .eq('student_id', report.student_id)
    .eq('subject_id', report.subject_id)
    .eq('period', report.period)
    .eq('academic_year', report.academic_year || 2026)
    .maybeSingle();

  if (existing) {
    // Update existing report
    const { data, error } = await supabase
      .from('qualitative_reports')
      .update({
        activities_not_delivered: report.activities_not_delivered,
        insufficient_activities: report.insufficient_activities,
        positive_notes: report.positive_notes,
        behavioral_issues: report.behavioral_issues,
        attendance_issues: report.attendance_issues,
        personal_presentation: report.personal_presentation,
        observations: report.observations,
        status: report.status,
      })
      .eq('id', existing.id)
      .select(`
        *,
        student:alumnos(id, name, last_name),
        subject:subjects(id, name),
        grade:grades(id, name)
      `)
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new report
    return createQualitativeReport(report);
  }
}

import { createFileRoute } from '@tanstack/react-router'
import { GradebookPage } from '@/features/gradebook/gradebook-page'
import { getSubjects, getGrades } from '@/services/assignments'

export const Route = createFileRoute('/_authenticated/planillas/$subjectId/$gradeId')({
  component: GradebookRoute,
  loader: async ({ params }) => {
    console.log('Route loader called with params:', params)
    const { subjectId, gradeId } = params
    
    try {
      const [subjects, grades] = await Promise.all([
        getSubjects(),
        getGrades()
      ])
      
      const subject = subjects.find(s => s.id === subjectId)
      const grade = grades.find(g => g.id === gradeId)
      
      return {
        subjectName: subject?.name || 'Materia Desconocida',
        gradeName: grade?.name || 'Grado Desconocido'
      }
    } catch (error) {
      console.error('Error in route loader:', error)
      return {
        subjectName: 'Materia',
        gradeName: 'Grado'
      }
    }
  }
})

function GradebookRoute() {
  console.log('GradebookRoute component starting...')
  
  try {
    const { subjectId, gradeId } = Route.useParams()
    const loaderData = Route.useLoaderData()
    
    console.log('GradebookRoute called:', { subjectId, gradeId, loaderData })
    
    return (
      <GradebookPage 
        subjectId={subjectId} 
        gradeId={gradeId}
        subjectName={loaderData.subjectName}
        gradeName={loaderData.gradeName}
      />
    )
  } catch (error) {
    console.error('Error in GradebookRoute:', error)
    return <div>Error loading gradebook: {error.message}</div>
  }
}

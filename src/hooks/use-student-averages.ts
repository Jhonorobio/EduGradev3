import { useState, useEffect, useMemo } from 'react'
import { calculateStudentAverage as calculateStudentAverageService } from '@/services/gradebook'

export function useStudentAverages(
  students: any[], 
  activities: any[], 
  grades: Record<string, Record<string, number>>
) {
  const [averages, setAverages] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const calculateAverages = async () => {
      if (!students.length || !activities.length) {
        setAverages({})
        return
      }

      setLoading(true)
      const newAverages: Record<string, number> = {}

      try {
        // Calculate averages for all students in parallel
        const promises = students.map(async (student) => {
          const average = await calculateStudentAverageService(student.id, activities, grades)
          return { studentId: student.id, average }
        })

        const results = await Promise.all(promises)
        results.forEach(({ studentId, average }) => {
          newAverages[studentId] = average
        })

        setAverages(newAverages)
      } catch (error) {
        console.error('Error calculating student averages:', error)
      } finally {
        setLoading(false)
      }
    }

    calculateAverages()
  }, [students, activities, grades])

  const getAverage = (studentId: string) => averages[studentId] || 0
  
  const getClassAverage = useMemo(() => {
    if (!students.length) return 0
    
    const totalAverage = students.reduce((sum, student) => {
      return sum + (averages[student.id] || 0)
    }, 0)
    
    return totalAverage / students.length
  }, [students, averages])

  const getGradedCount = useMemo(() => {
    return Object.values(grades).reduce((count, studentGrades) => {
      return count + Object.values(studentGrades).filter(grade => grade > 0).length
    }, 0)
  }, [grades])

  return {
    averages,
    loading,
    getAverage,
    getClassAverage,
    getGradedCount
  }
}

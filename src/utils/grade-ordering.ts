// Función global para ordenar grados en todo el sistema
export function sortGradesEducationally(grades: { id: string; name: string }[]): { id: string; name: string }[] {
  const gradeOrder = [
    'Jardín', 'Jardin', 'Kindergarten', 'Kínder',
    'Transición', 'Transicion', 'Transition',
    'Preescolar', 'Preescolar', 'Pre-school', 'Preschool',
    'Primero', '1°', '1º', 'Primero de Primaria', '1er Grado',
    'Segundo', '2°', '2º', 'Segundo de Primaria', '2do Grado',
    'Tercero', '3°', '3º', 'Tercero de Primaria', '3er Grado',
    'Cuarto', '4°', '4º', 'Cuarto de Primaria', '4to Grado',
    'Quinto', '5°', '5º', 'Quinto de Primaria', '5to Grado',
    'Sexto', '6°', '6º', 'Sexto de Primaria', '6to Grado',
    'Septimo', 'Séptimo', '7°', '7º', 'Septimo de Básica', 'Séptimo de Básica', '7mo Grado',
    'Octavo', '8°', '8º', 'Octavo de Básica', '8vo Grado',
    'Noveno', '9°', '9º', 'Noveno de Básica', '9no Grado',
    'Decimo', 'Décimo', '10°', '10º', 'Décimo de Bachillerato', '10mo Grado',
    'Once', 'Undécimo', '11°', '11º', 'Undécimo de Bachillerato', '11vo Grado'
  ]

  return grades.sort((a, b) => {
    const aIndex = gradeOrder.findIndex(grade => 
      a.name.toLowerCase().includes(grade.toLowerCase()) || 
      grade.toLowerCase().includes(a.name.toLowerCase())
    )
    const bIndex = gradeOrder.findIndex(grade => 
      b.name.toLowerCase().includes(grade.toLowerCase()) || 
      grade.toLowerCase().includes(b.name.toLowerCase())
    )
    
    if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

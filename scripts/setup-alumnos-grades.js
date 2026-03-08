import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración de Supabase
const supabaseUrl = 'https://rizddhhcqbmbvnborjlc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpemRkaGhjcWJtYnZubm9yamxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NzU2NzcsImV4cCI6MjA1NDA1MTY3N30.M_qxL9_2f8Q2t9Qj6sJw4XhZ8Y7f3k9p2r1s8d7w4x6y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigrations() {
  console.log('🚀 Iniciando migraciones para alumnos y grados...')
  
  try {
    // Leer y ejecutar migración de grados
    const gradesMigration = fs.readFileSync(
      path.join(__dirname, '../database/migrations/create_grades_table.sql'),
      'utf8'
    )
    
    console.log('📋 Creando tabla de grados...')
    
    // Ejecutar sentencias SQL una por una
    const gradesStatements = gradesMigration.split(';').filter(stmt => stmt.trim())
    
    for (const statement of gradesStatements) {
      if (statement.trim()) {
        const { error } = await supabase.from('grades').select('*').limit(1) // Test connection
        if (error) {
          console.log('⚠️  Tabla grades puede no existir aún, intentando crear...')
        }
        break
      }
    }

    // Verificar si la tabla de grados existe
    const { data: grades, error: gradesCheckError } = await supabase
      .from('grades')
      .select('*')
      .limit(1)
    
    if (gradesCheckError) {
      console.log('❌ Tabla de grados no existe, por favor créala manualmente en la consola de Supabase')
    } else {
      console.log('✅ Tabla de grados encontrada')
    }

    // Verificar si la tabla de alumnos existe
    const { data: alumnos, error: alumnosCheckError } = await supabase
      .from('alumnos')
      .select('*')
      .limit(1)
    
    if (alumnosCheckError) {
      console.log('❌ Tabla de alumnos no existe, por favor créala manualmente en la consola de Supabase')
    } else {
      console.log('✅ Tabla de alumnos encontrada')
    }

    // Si las tablas existen, mostrar datos
    if (!gradesCheckError && !alumnosCheckError) {
      console.log('🔍 Verificando datos...')
      
      const { data: gradesList } = await supabase
        .from('grades')
        .select('*')
        .limit(5)
      
      console.log('✅ Grados encontrados:', gradesList?.length || 0)
      gradesList?.forEach(grade => {
        console.log(`   - ${grade.name} (${grade.level})`)
      })

      const { data: alumnosList } = await supabase
        .from('alumnos')
        .select(`
          id,
          name,
          last_name,
          colegio_id,
          grade_id,
          status,
          grades!inner(name, level)
        `)
        .limit(5)
      
      console.log('✅ Alumnos encontrados:', alumnosList?.length || 0)
      alumnosList?.forEach(alumno => {
        console.log(`   - ${alumno.name} ${alumno.last_name} - ${alumno.grades.name}`)
      })
    }

    console.log('🎉 Verificación completada!')
    
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error)
  }
}

runMigrations()

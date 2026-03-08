-- ========================================
-- Crear tablas para el sistema de alumnos
-- Ejecutar en la consola SQL de Supabase
-- ========================================

-- 1. Crear tabla de grados
CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Preescolar', 'Primaria', 'Bachillerato')),
  group_director TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS para la tabla de grados
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas para la tabla de grados
CREATE POLICY "Authenticated users can view grades" ON grades
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage grades" ON grades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Admin colegio can manage grades" ON grades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN_COLEGIO'
    )
  );

-- 4. Insertar datos de ejemplo para grados
INSERT INTO grades (id, name, level, group_director) VALUES
('1', '1° A', 'Primaria', 'Prof. Juan Pérez'),
('2', '2° B', 'Primaria', 'Prof. María García'),
('3', '3° C', 'Primaria', 'Prof. Carlos López'),
('4', '4° A', 'Primaria', 'Prof. Ana Martínez'),
('5', '5° B', 'Primaria', 'Prof. Luis Rodríguez'),
('6', '6° C', 'Primaria', 'Prof. Sofía Hernández'),
('7', '1° A', 'Bachillerato', 'Prof. Diego Sánchez'),
('8', '2° B', 'Bachillerato', 'Prof. Patricia Torres'),
('9', '3° C', 'Bachillerato', 'Prof. Roberto Castro'),
('10', 'Preescolar A', 'Preescolar', 'Prof. Carmen Vargas');

-- 5. Crear tabla de alumnos
CREATE TABLE IF NOT EXISTS alumnos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  colegio_id TEXT NOT NULL REFERENCES colegios(id) ON DELETE CASCADE,
  grade_id TEXT NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Habilitar RLS para la tabla de alumnos
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas para la tabla de alumnos
CREATE POLICY "Authenticated users can view alumnos" ON alumnos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage alumnos" ON alumnos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Admin colegio can manage alumnos" ON alumnos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN_COLEGIO'
    )
  );

CREATE POLICY "Docente can view alumnos" ON alumnos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'DOCENTE'
    )
  );

-- 8. Insertar datos de ejemplo para alumnos
INSERT INTO alumnos (id, name, last_name, colegio_id, grade_id, status) VALUES
('1', 'Ana Sofía', 'Martínez Pérez', '1', '1', 'active'),
('2', 'Carlos Andrés', 'García López', '1', '2', 'active'),
('3', 'María Fernanda', 'Rodríguez Castro', '2', '3', 'active'),
('4', 'Luis Miguel', 'Sánchez Torres', '3', '1', 'inactive'),
('5', 'Valentina', 'Gómez Hernández', '2', '4', 'active'),
('6', 'José Antonio', 'Ramírez Silva', '1', '5', 'active'),
('7', 'Isabella', 'Díaz Morales', '2', '6', 'active'),
('8', 'Daniel', 'Vargas Castillo', '3', '7', 'active'),
('9', 'Sofía', 'Mendoza Ruiz', '1', '8', 'active'),
('10', 'Mateo', 'Ortiz Jiménez', '2', '9', 'active'),
('11', 'Emma', 'Reyes Medina', '3', '10', 'active'),
('12', 'Lucas', 'Paredes Navarro', '1', '1', 'suspended');

-- 9. Verificar que todo esté correcto
SELECT 'Grados creados:' as info, COUNT(*) as total FROM grades;
SELECT 'Alumnos creados:' as info, COUNT(*) as total FROM alumnos;

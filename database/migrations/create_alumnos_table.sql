-- Create alumnos table
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

-- Enable RLS for this table
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view alumnos
CREATE POLICY "Authenticated users can view alumnos" ON alumnos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for super admins to manage alumnos
CREATE POLICY "Super admins can manage alumnos" ON alumnos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Create policy for admin_colegio to manage alumnos
CREATE POLICY "Admin colegio can manage alumnos" ON alumnos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN_COLEGIO'
    )
  );

-- Create policy for docente to view alumnos
CREATE POLICY "Docente can view alumnos" ON alumnos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'DOCENTE'
    )
  );

-- Insert some sample alumnos
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

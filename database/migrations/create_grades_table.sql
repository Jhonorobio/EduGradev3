-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Preescolar', 'Primaria', 'Bachillerato')),
  group_director TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for this table
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view grades
CREATE POLICY "Authenticated users can view grades" ON grades
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for super admins to manage grades
CREATE POLICY "Super admins can manage grades" ON grades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Create policy for admin_colegio to manage grades
CREATE POLICY "Admin colegio can manage grades" ON grades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN_COLEGIO'
    )
  );

-- Insert some sample grades
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

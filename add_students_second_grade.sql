-- Script para agregar 15 estudiantes al grado Segundo
-- Ejecutar este script directamente en la consola SQL de Supabase

-- Verificar el ID del grado Segundo
SELECT id, name FROM grades WHERE name = 'Segundo';

-- Insertar 15 estudiantes para el grado Segundo
INSERT INTO students (name, last_name, enrollment_number, grade_level_id) VALUES
('Ana Sofía', 'Martínez', 'SEG001', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('Carlos Andrés', 'González', 'SEG002', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('María Fernanda', 'Rodríguez', 'SEG003', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('Luis Miguel', 'López', 'SEG004', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('Sofía Valentina', 'Hernández', 'SEG005', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('Diego Alejandro', 'Martínez', 'SEG006', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('Valentina Camila', 'García', 'SEG007', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('José Manuel', 'Sánchez', 'SEG008', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('Isabella Victoria', 'Díaz', 'SEG009', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('Sebastián Nicolás', 'Torres', 'SEG010', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('Emma Lucía', 'Ramírez', 'SEG011', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('Mateo David', 'Flores', 'SEG012', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('Luciana Daniela', 'Vargas', 'SEG013', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('Adrián Gabriel', 'Castillo', 'SEG014', '1c3ba01f-7235-4092-9945-c6e1e6bfef99'),
('Paulina Alejandra', 'Mendoza', 'SEG015', '1c3ba01f-7235-4092-9945-c6e1e6bfef99')
ON CONFLICT (enrollment_number) DO NOTHING;

-- Verificar que los estudiantes fueron agregados correctamente
SELECT 
  id, 
  name, 
  last_name, 
  enrollment_number, 
  grade_level_id,
  (SELECT name FROM grades WHERE id = grade_level_id) as grade_name
FROM students 
WHERE grade_level_id = '1c3ba01f-7235-4092-9945-c6e1e6bfef99'
ORDER BY enrollment_number;

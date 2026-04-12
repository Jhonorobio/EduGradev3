-- Add performance_scale column to colegio_settings table
-- This column stores the ranges for student performance classification

-- Add the column as JSONB to store structured data
ALTER TABLE public.colegio_settings 
ADD COLUMN IF NOT EXISTS performance_scale JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.colegio_settings.performance_scale IS 
'Escala de rangos de desempeño: bajo, basico, alto, superior. Cada rango tiene nombre, min y max';

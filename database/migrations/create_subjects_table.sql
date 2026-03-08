-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  levels TEXT[] DEFAULT '{}',
  Colegio_id UUID REFERENCES public.colegios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view subjects" ON public.subjects
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert subjects" ON public.subjects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN_COLEGIO')
    )
  );

CREATE POLICY "Admins can update subjects" ON public.subjects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN_COLEGIO')
    )
  );

CREATE POLICY "Admins can delete subjects" ON public.subjects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN_COLEGIO')
    )
  );

-- Add index
CREATE INDEX IF NOT EXISTS idx_subjects_colegio ON public.subjects(colegio_id);

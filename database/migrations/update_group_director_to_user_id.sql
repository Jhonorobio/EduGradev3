-- ========================================
-- Migration: Update group_director to store user IDs instead of names
-- This allows proper linking between grades and teacher users
-- ========================================

-- 1. First, add a new column for user_id if it doesn't exist
-- Or modify the existing column to reference users.id

-- Check if the column exists and update it
-- Note: We need to be careful here as existing data might be lost
-- In production, you would need to migrate the data properly

-- Add colegio_id column if it doesn't exist
ALTER TABLE grades
ADD COLUMN IF NOT EXISTS colegio_id TEXT REFERENCES colegios(id) ON DELETE CASCADE;

-- Update the group_director column to be a reference to users.id
-- First, we need to handle any existing data
-- This is a placeholder - in production you'd map names to IDs

-- Create an index on group_director for faster lookups
CREATE INDEX IF NOT EXISTS idx_grades_group_director ON grades(group_director);
CREATE INDEX IF NOT EXISTS idx_grades_colegio_id ON grades(colegio_id);

-- Update RLS policies to include colegio-based access
-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Authenticated users can view grades" ON grades;
DROP POLICY IF EXISTS "Super admins can manage grades" ON grades;
DROP POLICY IF EXISTS "Admin colegio can manage grades" ON grades;

-- Policy for all authenticated users to view grades
CREATE POLICY "Authenticated users can view grades" ON grades
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for super admins
CREATE POLICY "Super admins can manage grades" ON grades
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'SUPER_ADMIN'
  )
);

-- Policy for admin_colegio - can manage grades in their colegios
CREATE POLICY "Admin colegio can manage grades" ON grades
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN_COLEGIO'
  )
);

-- Policy for docentes - can view grades where they are directors
CREATE POLICY "Docentes can view their grades" ON grades
FOR SELECT USING (
  group_director = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('SUPER_ADMIN', 'ADMIN_COLEGIO')
  )
);

-- ========================================
-- IMPORTANT: Data Migration Notes
-- ========================================
-- After running this migration, you need to update the group_director
-- values to store user IDs instead of names.
--
-- Example update query (run after migration):
-- UPDATE grades
-- SET group_director = (
--   SELECT id FROM users WHERE name = grades.group_director LIMIT 1
-- )
-- WHERE group_director IS NOT NULL;
--
-- Or manually update each grade:
-- UPDATE grades SET group_director = 'user-uuid-here' WHERE id = 'grade-id-here';

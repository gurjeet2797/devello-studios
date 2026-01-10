-- Fix partners table to match Prisma schema
-- Make description, experience_years, and phone nullable

-- Drop NOT NULL constraints
ALTER TABLE partners 
  ALTER COLUMN description DROP NOT NULL,
  ALTER COLUMN experience_years DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL;

-- Verify the changes
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'partners'
  AND column_name IN ('description', 'experience_years', 'phone')
ORDER BY column_name;


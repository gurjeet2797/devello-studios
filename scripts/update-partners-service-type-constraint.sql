-- Update partners table to allow 'manufacturing' service type
-- Run this in your Supabase SQL Editor or database console

-- First, drop the existing CHECK constraint
ALTER TABLE partners 
DROP CONSTRAINT IF EXISTS partners_service_type_check;

-- Add the new CHECK constraint with 'manufacturing' included
ALTER TABLE partners 
ADD CONSTRAINT partners_service_type_check 
CHECK (service_type IN ('construction', 'software_development', 'consulting', 'manufacturing'));

-- Verify the constraint was updated
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'partners'::regclass
  AND conname = 'partners_service_type_check';


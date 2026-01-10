-- Change email notification default to true for new users and partners
-- This migration updates the default value for future inserts

-- Change default for user_profiles
ALTER TABLE "user_profiles" 
ALTER COLUMN "email_notifications_enabled" SET DEFAULT true;

-- Change default for partners
ALTER TABLE "partners" 
ALTER COLUMN "email_notifications_enabled" SET DEFAULT true;


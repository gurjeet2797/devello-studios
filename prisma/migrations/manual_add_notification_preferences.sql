-- Add email notification preferences to user_profiles and partners tables

-- Add email_notifications_enabled to user_profiles
ALTER TABLE "user_profiles" 
ADD COLUMN IF NOT EXISTS "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT true;

-- Add email_notifications_enabled to partners
ALTER TABLE "partners" 
ADD COLUMN IF NOT EXISTS "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT true;


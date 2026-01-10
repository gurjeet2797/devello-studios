-- Fix guest_sessions cleanup function permissions
-- This addresses the permission denied error found by Supabase AI

-- Update the function to use SECURITY DEFINER and proper search_path
ALTER FUNCTION public.cleanup_expired_guest_sessions() 
SECURITY DEFINER 
SET search_path = public, pg_temp;

-- Revoke public access and grant to appropriate role
REVOKE ALL ON FUNCTION public.cleanup_expired_guest_sessions() FROM PUBLIC;

-- Grant execute permission to the role that runs pg_cron jobs
-- (This should be the role that actually runs the cron job)
GRANT EXECUTE ON FUNCTION public.cleanup_expired_guest_sessions() TO postgres;

-- Ensure the function owner has proper privileges on guest_sessions table
GRANT SELECT, DELETE ON public.guest_sessions TO postgres;

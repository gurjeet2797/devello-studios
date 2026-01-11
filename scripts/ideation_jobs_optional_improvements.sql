-- ============================================
-- OPTIONAL IMPROVEMENTS FOR IDEATION_JOBS TABLE
-- Run these after the main migration
-- ============================================

-- 1. Add CHECK constraint on progress (0-100)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ideation_jobs_progress_check'
        AND table_name = 'ideation_jobs'
    ) THEN
        ALTER TABLE "ideation_jobs" 
        ADD CONSTRAINT "ideation_jobs_progress_check" 
        CHECK ("progress" >= 0 AND "progress" <= 100);
    END IF;
END $$;

-- 2. Add partial index for inflight jobs (queued/processing)
-- This speeds up queries for active jobs
CREATE INDEX IF NOT EXISTS "ideation_jobs_inflight_created_idx" 
ON "ideation_jobs"("created_at") 
WHERE "status" IN ('queued', 'processing');

-- 3. Optional: Add index for completed jobs (for analytics/cleanup)
CREATE INDEX IF NOT EXISTS "ideation_jobs_completed_created_idx" 
ON "ideation_jobs"("created_at") 
WHERE "status" = 'completed';

-- 4. Optional: Add index for failed jobs (for debugging)
CREATE INDEX IF NOT EXISTS "ideation_jobs_failed_created_idx" 
ON "ideation_jobs"("created_at") 
WHERE "status" = 'failed';

COMMENT ON INDEX "ideation_jobs_inflight_created_idx" IS 'Partial index for active (queued/processing) jobs - speeds up job queue queries';
COMMENT ON INDEX "ideation_jobs_completed_created_idx" IS 'Partial index for completed jobs - useful for analytics and cleanup';
COMMENT ON INDEX "ideation_jobs_failed_created_idx" IS 'Partial index for failed jobs - useful for debugging and retry logic';

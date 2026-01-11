-- ============================================
-- CREATE IDEATION_JOBS TABLE
-- Creative Intelligence Engine - AI-powered ideation
-- ============================================

-- Create ideation_jobs table
CREATE TABLE IF NOT EXISTS "ideation_jobs" (
    "id" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "prompt" TEXT NOT NULL,
    "context" JSONB,
    "result" JSONB,
    "errors" JSONB,
    "total_cost" DECIMAL(10, 6),
    "cost_breakdown" JSONB,
    "user_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "ideation_jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ideation_jobs_status_check" CHECK (
        "status" IN ('queued', 'processing', 'completed', 'failed')
    )
);

-- Create standard indexes
CREATE INDEX IF NOT EXISTS "ideation_jobs_status_idx" ON "ideation_jobs"("status");
CREATE INDEX IF NOT EXISTS "ideation_jobs_user_id_idx" ON "ideation_jobs"("user_id");
CREATE INDEX IF NOT EXISTS "ideation_jobs_created_at_idx" ON "ideation_jobs"("created_at");

-- Create GIN indexes for JSONB columns (for efficient JSON queries)
CREATE INDEX IF NOT EXISTS "ideation_jobs_context_gin_idx" ON "ideation_jobs" USING GIN ("context");
CREATE INDEX IF NOT EXISTS "ideation_jobs_result_gin_idx" ON "ideation_jobs" USING GIN ("result");
CREATE INDEX IF NOT EXISTS "ideation_jobs_cost_breakdown_gin_idx" ON "ideation_jobs" USING GIN ("cost_breakdown");

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS "ideation_jobs_user_status_idx" ON "ideation_jobs"("user_id", "status") WHERE "user_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "ideation_jobs_status_created_idx" ON "ideation_jobs"("status", "created_at");

-- Add foreign key constraint for user_id (references custom users table)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'ideation_jobs_user_id_fkey'
            AND table_name = 'ideation_jobs'
        ) THEN
            ALTER TABLE "ideation_jobs" 
            ADD CONSTRAINT "ideation_jobs_user_id_fkey" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE "ideation_jobs" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own ideation jobs" ON "ideation_jobs";
DROP POLICY IF EXISTS "Users can create own ideation jobs" ON "ideation_jobs";
DROP POLICY IF EXISTS "Users can update own ideation jobs" ON "ideation_jobs";
DROP POLICY IF EXISTS "Service role can manage all ideation jobs" ON "ideation_jobs";

-- Policy: Users can view their own ideation jobs
CREATE POLICY "Users can view own ideation jobs"
ON "ideation_jobs"
FOR SELECT
TO authenticated
USING (
    "user_id" IN (
        SELECT "id" FROM "users" 
        WHERE "supabase_user_id" = auth.uid()::text
    )
    OR "user_id" IS NULL  -- Allow viewing anonymous jobs (optional - remove if you want strict auth)
);

-- Policy: Users can create their own ideation jobs
CREATE POLICY "Users can create own ideation jobs"
ON "ideation_jobs"
FOR INSERT
TO authenticated
WITH CHECK (
    "user_id" IN (
        SELECT "id" FROM "users" 
        WHERE "supabase_user_id" = auth.uid()::text
    )
    OR "user_id" IS NULL  -- Allow anonymous job creation
);

-- Policy: Users can update their own ideation jobs (only while processing/queued)
CREATE POLICY "Users can update own ideation jobs"
ON "ideation_jobs"
FOR UPDATE
TO authenticated
USING (
    "user_id" IN (
        SELECT "id" FROM "users" 
        WHERE "supabase_user_id" = auth.uid()::text
    )
    AND "status" IN ('queued', 'processing')  -- Only allow updates during processing
);

-- Policy: Service role can manage all ideation jobs (for background workers)
CREATE POLICY "Service role can manage all ideation jobs"
ON "ideation_jobs"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE "ideation_jobs" IS 'Stores AI-powered ideation jobs that transform app ideas into complete product concepts';
COMMENT ON COLUMN "ideation_jobs"."status" IS 'Job status: queued, processing, completed, or failed';
COMMENT ON COLUMN "ideation_jobs"."progress" IS 'Progress percentage (0-100)';
COMMENT ON COLUMN "ideation_jobs"."context" IS 'Optional context: { platform, industry, tone, targetAudience }';
COMMENT ON COLUMN "ideation_jobs"."result" IS 'Generated concept JSON: { name, tagline, features, tech_stack, monetization, roadmap, ui_inspiration }';
COMMENT ON COLUMN "ideation_jobs"."cost_breakdown" IS 'API cost breakdown: { gemini: 0.05 }';

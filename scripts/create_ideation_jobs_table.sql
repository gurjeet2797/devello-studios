-- Create ideation_jobs table for Creative Intelligence Engine
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

    CONSTRAINT "ideation_jobs_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "ideation_jobs_status_idx" ON "ideation_jobs"("status");
CREATE INDEX IF NOT EXISTS "ideation_jobs_user_id_idx" ON "ideation_jobs"("user_id");
CREATE INDEX IF NOT EXISTS "ideation_jobs_created_at_idx" ON "ideation_jobs"("created_at");

-- Add foreign key constraint for user_id (optional - only if users table exists)
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

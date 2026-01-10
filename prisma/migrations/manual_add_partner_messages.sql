-- Create partner_messages table
CREATE TABLE IF NOT EXISTS "partner_messages" (
  "id" TEXT NOT NULL,
  "partner_id" UUID NOT NULL,
  "sender_name" TEXT NOT NULL,
  "sender_email" TEXT NOT NULL,
  "sender_phone" TEXT,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new',
  "read_at" TIMESTAMP(3),
  "replied_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "partner_messages_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'partner_messages_partner_id_fkey'
  ) THEN
    ALTER TABLE "partner_messages" 
    ADD CONSTRAINT "partner_messages_partner_id_fkey" 
    FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "partner_messages_partner_id_idx" ON "partner_messages"("partner_id");
CREATE INDEX IF NOT EXISTS "partner_messages_status_idx" ON "partner_messages"("status");

-- Add comment
COMMENT ON TABLE "partner_messages" IS 'Messages sent to partners from potential clients';


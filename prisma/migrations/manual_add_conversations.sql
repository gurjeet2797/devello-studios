-- Add conversation_id and user_id to partner_messages
ALTER TABLE "partner_messages" 
ADD COLUMN IF NOT EXISTS "conversation_id" TEXT,
ADD COLUMN IF NOT EXISTS "user_id" TEXT,
ADD COLUMN IF NOT EXISTS "sender_id" TEXT DEFAULT 'client', -- 'client' or 'partner'
ADD COLUMN IF NOT EXISTS "reply_to_id" TEXT;

-- Create conversations table
CREATE TABLE IF NOT EXISTS "conversations" (
  "id" TEXT NOT NULL,
  "partner_id" UUID NOT NULL,
  "user_id" TEXT,
  "subject" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active', -- active, closed
  "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversations_partner_id_fkey'
  ) THEN
    ALTER TABLE "conversations" 
    ADD CONSTRAINT "conversations_partner_id_fkey" 
    FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversations_user_id_fkey'
  ) THEN
    ALTER TABLE "conversations" 
    ADD CONSTRAINT "conversations_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'partner_messages_conversation_id_fkey'
  ) THEN
    ALTER TABLE "partner_messages" 
    ADD CONSTRAINT "partner_messages_conversation_id_fkey" 
    FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'partner_messages_user_id_fkey'
  ) THEN
    ALTER TABLE "partner_messages" 
    ADD CONSTRAINT "partner_messages_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'partner_messages_reply_to_id_fkey'
  ) THEN
    ALTER TABLE "partner_messages" 
    ADD CONSTRAINT "partner_messages_reply_to_id_fkey" 
    FOREIGN KEY ("reply_to_id") REFERENCES "partner_messages"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "conversations_partner_id_idx" ON "conversations"("partner_id");
CREATE INDEX IF NOT EXISTS "conversations_user_id_idx" ON "conversations"("user_id");
CREATE INDEX IF NOT EXISTS "conversations_status_idx" ON "conversations"("status");
CREATE INDEX IF NOT EXISTS "partner_messages_conversation_id_idx" ON "partner_messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "partner_messages_user_id_idx" ON "partner_messages"("user_id");
CREATE INDEX IF NOT EXISTS "partner_messages_sender_id_idx" ON "partner_messages"("sender_id");

-- Add comments
COMMENT ON TABLE "conversations" IS 'Conversations between clients and partners';
COMMENT ON COLUMN "partner_messages"."conversation_id" IS 'Links message to a conversation thread';
COMMENT ON COLUMN "partner_messages"."user_id" IS 'User ID if message sent by signed-in user';
COMMENT ON COLUMN "partner_messages"."sender_id" IS 'client or partner';
COMMENT ON COLUMN "partner_messages"."reply_to_id" IS 'ID of message this is replying to';


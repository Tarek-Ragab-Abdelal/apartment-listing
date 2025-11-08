/*
  Warnings:

  - You are about to drop the column `apartment_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `receiver_id` on the `messages` table. All the data in the column will be lost.
  - Added the required column `conversation_id` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'SYSTEM');

-- First, create the conversations table
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apartment_id" UUID NOT NULL,
    "user1_id" UUID NOT NULL,
    "user2_id" UUID NOT NULL,
    "last_message_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys for conversations
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create unique index
CREATE UNIQUE INDEX "conversations_apartment_id_user1_id_user2_id_key" ON "conversations"("apartment_id", "user1_id", "user2_id");

-- Add new columns to messages table first
ALTER TABLE "messages" 
ADD COLUMN "conversation_id" UUID,
ADD COLUMN "edited_at" TIMESTAMPTZ,
ADD COLUMN "message_type" "MessageType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN "read_at" TIMESTAMPTZ;

-- Migrate existing messages data
-- Create conversations for existing messages and update conversation_id
INSERT INTO "conversations" ("apartment_id", "user1_id", "user2_id", "last_message_at", "created_at", "updated_at")
SELECT DISTINCT 
    m.apartment_id,
    CASE 
        -- Make the apartment lister always user1
        WHEN a.lister_id = m.sender_id THEN m.sender_id
        ELSE COALESCE(a.lister_id, m.sender_id)
    END as user1_id,
    CASE 
        WHEN a.lister_id = m.sender_id THEN m.receiver_id
        ELSE m.sender_id
    END as user2_id,
    MAX(m.created_at) as last_message_at,
    MIN(m.created_at) as created_at,
    NOW() as updated_at
FROM "messages" m
JOIN "apartments" a ON m.apartment_id = a.id
GROUP BY m.apartment_id, 
    CASE 
        WHEN a.lister_id = m.sender_id THEN m.sender_id
        ELSE COALESCE(a.lister_id, m.sender_id)
    END,
    CASE 
        WHEN a.lister_id = m.sender_id THEN m.receiver_id
        ELSE m.sender_id
    END
ON CONFLICT ("apartment_id", "user1_id", "user2_id") DO NOTHING;

-- Update messages with conversation_id
UPDATE "messages" 
SET conversation_id = c.id
FROM "conversations" c
JOIN "apartments" a ON c.apartment_id = a.id
WHERE "messages".apartment_id = c.apartment_id
  AND (
    -- Case 1: sender is lister
    (a.lister_id = "messages".sender_id AND c.user1_id = "messages".sender_id AND c.user2_id = "messages".receiver_id)
    OR
    -- Case 2: sender is not lister
    (a.lister_id != "messages".sender_id AND c.user1_id = a.lister_id AND c.user2_id = "messages".sender_id)
  );

-- Make conversation_id NOT NULL
ALTER TABLE "messages" ALTER COLUMN "conversation_id" SET NOT NULL;

-- Drop old foreign keys
ALTER TABLE "messages" DROP CONSTRAINT "messages_apartment_id_fkey";
ALTER TABLE "messages" DROP CONSTRAINT "messages_receiver_id_fkey";

-- Drop old columns
ALTER TABLE "messages" DROP COLUMN "apartment_id";
ALTER TABLE "messages" DROP COLUMN "receiver_id";

-- Add new foreign key
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

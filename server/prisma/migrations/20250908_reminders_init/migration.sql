-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReminderChannel" AS ENUM ('EMAIL', 'SMS', 'BOTH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReminderFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterEnum
DO $$ BEGIN
  DELETE FROM "ReminderType" WHERE value = 'RENT_LATE';
  DELETE FROM "ReminderType" WHERE value = 'PAYMENT_RECEIPT';
  DELETE FROM "ReminderType" WHERE value = 'LEASE_EXPIRY';
  ALTER TYPE "ReminderType" ADD VALUE IF NOT EXISTS 'LEASE_ENDING';
EXCEPTION
  WHEN others THEN null;
END $$;

-- AlterTable
ALTER TABLE "reminder_schedules" 
  ADD COLUMN IF NOT EXISTS "channel" "ReminderChannel" DEFAULT 'EMAIL',
  ADD COLUMN IF NOT EXISTS "frequency" "ReminderFrequency" DEFAULT 'DAILY',
  ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS "lastRunAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT,
  ADD COLUMN IF NOT EXISTS "propertyId" TEXT,
  ADD COLUMN IF NOT EXISTS "leaseId" TEXT;

-- Rename columns
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reminder_schedules' AND column_name = 'kind') THEN
    ALTER TABLE "reminder_schedules" RENAME COLUMN "kind" TO "type";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reminder_schedules' AND column_name = 'meta') THEN
    ALTER TABLE "reminder_schedules" RENAME COLUMN "meta" TO "metaJson";
  END IF;
END $$;

-- Update userId to be nullable
ALTER TABLE "reminder_schedules" ALTER COLUMN "userId" DROP NOT NULL;

-- Set default for metaJson
ALTER TABLE "reminder_schedules" ALTER COLUMN "metaJson" SET DEFAULT '{}'::jsonb;

-- CreateTable
CREATE TABLE IF NOT EXISTS "reminder_logs" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "runAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" "ReminderChannel" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "detail" TEXT,
    "metaJson" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "reminder_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReminderSchedule_isActive_nextRunAt_idx" ON "reminder_schedules"("isActive", "nextRunAt");

-- CreateIndex  
CREATE INDEX IF NOT EXISTS "ReminderSchedule_type_channel_idx" ON "reminder_schedules"("type", "channel");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReminderSchedule_tenantId_idx" ON "reminder_schedules"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReminderSchedule_propertyId_idx" ON "reminder_schedules"("propertyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReminderSchedule_leaseId_idx" ON "reminder_schedules"("leaseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReminderLog_scheduleId_runAt_idx" ON "reminder_logs"("scheduleId", "runAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "reminder_schedules" ADD CONSTRAINT "ReminderSchedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "reminder_schedules" ADD CONSTRAINT "ReminderSchedule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "reminder_schedules" ADD CONSTRAINT "ReminderSchedule_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "reminder_logs" ADD CONSTRAINT "ReminderLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "reminder_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
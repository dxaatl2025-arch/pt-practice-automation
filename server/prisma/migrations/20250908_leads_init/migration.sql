-- CreateEnum for Lead Temperature
DO $$ BEGIN
  CREATE TYPE "LeadTemp" AS ENUM ('COLD', 'WARM', 'HOT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for Lead Status
DO $$ BEGIN
  CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'VIEWING_SCHEDULED', 'APPLICATION_STARTED', 'APPLIED', 'CONVERTED', 'LOST');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable for Leads
CREATE TABLE IF NOT EXISTS "leads" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "budgetMin" DOUBLE PRECISION,
    "budgetMax" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "desiredArea" TEXT,
    "moveInDate" TIMESTAMPTZ,
    "petFriendly" BOOLEAN,
    "score" INTEGER NOT NULL DEFAULT 0,
    "temperature" "LeadTemp" NOT NULL DEFAULT 'COLD',
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "conversationHistory" JSONB NOT NULL DEFAULT '[]',
    "lastInteraction" TIMESTAMPTZ,
    "totalInteractions" INTEGER NOT NULL DEFAULT 0,
    "assignedToId" TEXT,
    "interestedProperties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "viewedProperties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metaData" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "leads_email_key" ON "leads"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "leads_temperature_idx" ON "leads"("temperature");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "leads_score_idx" ON "leads"("score");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "leads_assignedToId_idx" ON "leads"("assignedToId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "leads_createdAt_idx" ON "leads"("createdAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
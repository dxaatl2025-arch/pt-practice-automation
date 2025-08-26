-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'LANDLORD', 'TENANT', 'PROPERTY_MANAGER');

-- CreateEnum
CREATE TYPE "public"."PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'STUDIO', 'DUPLEX', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PropertyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'OCCUPIED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."LeaseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'TERMINATED', 'PENDING', 'RENEWED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('RENT', 'SECURITY_DEPOSIT', 'LATE_FEE', 'MAINTENANCE', 'UTILITIES', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'TENANT',
    "phone" TEXT,
    "firebaseUid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."properties" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "squareFeet" INTEGER,
    "rentAmount" DOUBLE PRECISION,
    "rentCurrency" TEXT NOT NULL DEFAULT 'USD',
    "deposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "addressStreet" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZip" TEXT,
    "addressCountry" TEXT NOT NULL DEFAULT 'US',
    "propertyType" "public"."PropertyType" NOT NULL DEFAULT 'APARTMENT',
    "status" "public"."PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "availableTo" TIMESTAMP(3),
    "amenities" JSONB,
    "images" JSONB,
    "petPolicy" TEXT,
    "utilities" JSONB,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "landlordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leases" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "securityDeposit" DOUBLE PRECISION,
    "status" "public"."LeaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "terms" TEXT,
    "notes" TEXT,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "type" "public"."PaymentType" NOT NULL DEFAULT 'RENT',
    "description" TEXT,
    "late" BOOLEAN NOT NULL DEFAULT false,
    "lateFee" DOUBLE PRECISION,
    "leaseId" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance_tickets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'OPEN',
    "category" TEXT,
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "assignedTo" TEXT,
    "completedAt" TIMESTAMP(3),
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."applications" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "applicantId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "currentAddress" TEXT NOT NULL,
    "currentCity" TEXT NOT NULL,
    "currentState" TEXT NOT NULL,
    "currentZip" TEXT NOT NULL,
    "yearsAtAddress" DOUBLE PRECISION NOT NULL,
    "reasonForMoving" TEXT,
    "employerName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "employerAddress" TEXT NOT NULL,
    "employerPhone" TEXT NOT NULL,
    "employmentLength" TEXT NOT NULL,
    "monthlyIncome" DOUBLE PRECISION NOT NULL,
    "otherIncome" DOUBLE PRECISION,
    "prevAddress" TEXT,
    "prevLandlordName" TEXT,
    "prevLandlordContact" TEXT,
    "reasonForLeaving" TEXT,
    "wasLateRent" BOOLEAN NOT NULL DEFAULT false,
    "refName" TEXT NOT NULL,
    "refRelationship" TEXT NOT NULL,
    "refContact" TEXT NOT NULL,
    "occupants" INTEGER NOT NULL,
    "pets" JSONB,
    "vehicles" JSONB,
    "wasEvicted" BOOLEAN NOT NULL DEFAULT false,
    "felony" BOOLEAN NOT NULL DEFAULT false,
    "desiredMoveIn" TIMESTAMP(3) NOT NULL,
    "consentBackground" BOOLEAN NOT NULL DEFAULT false,
    "signature" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "public"."users"("firebaseUid");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_firebaseUid_idx" ON "public"."users"("firebaseUid");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "properties_landlordId_idx" ON "public"."properties"("landlordId");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "public"."properties"("status");

-- CreateIndex
CREATE INDEX "properties_isAvailable_idx" ON "public"."properties"("isAvailable");

-- CreateIndex
CREATE INDEX "properties_propertyType_idx" ON "public"."properties"("propertyType");

-- CreateIndex
CREATE INDEX "leases_propertyId_idx" ON "public"."leases"("propertyId");

-- CreateIndex
CREATE INDEX "leases_tenantId_idx" ON "public"."leases"("tenantId");

-- CreateIndex
CREATE INDEX "leases_status_idx" ON "public"."leases"("status");

-- CreateIndex
CREATE INDEX "leases_startDate_idx" ON "public"."leases"("startDate");

-- CreateIndex
CREATE INDEX "leases_endDate_idx" ON "public"."leases"("endDate");

-- CreateIndex
CREATE INDEX "payments_leaseId_idx" ON "public"."payments"("leaseId");

-- CreateIndex
CREATE INDEX "payments_tenantId_idx" ON "public"."payments"("tenantId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_dueDate_idx" ON "public"."payments"("dueDate");

-- CreateIndex
CREATE INDEX "payments_type_idx" ON "public"."payments"("type");

-- CreateIndex
CREATE INDEX "maintenance_tickets_propertyId_idx" ON "public"."maintenance_tickets"("propertyId");

-- CreateIndex
CREATE INDEX "maintenance_tickets_tenantId_idx" ON "public"."maintenance_tickets"("tenantId");

-- CreateIndex
CREATE INDEX "maintenance_tickets_status_idx" ON "public"."maintenance_tickets"("status");

-- CreateIndex
CREATE INDEX "maintenance_tickets_priority_idx" ON "public"."maintenance_tickets"("priority");

-- CreateIndex
CREATE INDEX "maintenance_tickets_assignedTo_idx" ON "public"."maintenance_tickets"("assignedTo");

-- CreateIndex
CREATE INDEX "applications_propertyId_idx" ON "public"."applications"("propertyId");

-- CreateIndex
CREATE INDEX "applications_applicantId_idx" ON "public"."applications"("applicantId");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "public"."applications"("status");

-- CreateIndex
CREATE INDEX "applications_submittedAt_idx" ON "public"."applications"("submittedAt");

-- CreateIndex
CREATE INDEX "applications_email_idx" ON "public"."applications"("email");

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."leases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

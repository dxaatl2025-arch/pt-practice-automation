-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'LANDLORD', 'TENANT', 'PROPERTY_MANAGER');

-- CreateEnum
CREATE TYPE "public"."PropertyStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "public"."LeaseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'TERMINATED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('RENT', 'SECURITY_DEPOSIT', 'LATE_FEE', 'MAINTENANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'TENANT',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."properties" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "rent" DOUBLE PRECISION NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" DOUBLE PRECISION NOT NULL,
    "squareFeet" INTEGER,
    "description" TEXT,
    "status" "public"."PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leaseId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance_tickets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "maintenance_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rental_applications" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "socialSecurityNumber" TEXT NOT NULL,
    "currentAddress" TEXT NOT NULL,
    "currentCity" TEXT NOT NULL,
    "currentState" TEXT NOT NULL,
    "currentZip" TEXT NOT NULL,
    "currentRent" DOUBLE PRECISION,
    "moveOutReason" TEXT,
    "employer" TEXT,
    "jobTitle" TEXT,
    "employmentLength" TEXT,
    "monthlyIncome" DOUBLE PRECISION,
    "additionalIncome" DOUBLE PRECISION,
    "previousLandlordName" TEXT,
    "previousLandlordPhone" TEXT,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "emergencyContactRelation" TEXT NOT NULL,
    "hasEvictions" BOOLEAN NOT NULL DEFAULT false,
    "evictionDetails" TEXT,
    "hasCriminalHistory" BOOLEAN NOT NULL DEFAULT false,
    "criminalDetails" TEXT,
    "hasPets" BOOLEAN NOT NULL DEFAULT false,
    "petDetails" TEXT,
    "smokingStatus" TEXT,
    "additionalOccupants" TEXT,
    "specialRequests" TEXT,
    "signatureData" TEXT,
    "signedAt" TIMESTAMP(3),
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "aiScore" DOUBLE PRECISION,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,
    "applicantId" TEXT,

    CONSTRAINT "rental_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "properties_ownerId_idx" ON "public"."properties"("ownerId");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "public"."properties"("status");

-- CreateIndex
CREATE INDEX "leases_propertyId_idx" ON "public"."leases"("propertyId");

-- CreateIndex
CREATE INDEX "leases_tenantId_idx" ON "public"."leases"("tenantId");

-- CreateIndex
CREATE INDEX "leases_status_idx" ON "public"."leases"("status");

-- CreateIndex
CREATE INDEX "payments_leaseId_idx" ON "public"."payments"("leaseId");

-- CreateIndex
CREATE INDEX "payments_tenantId_idx" ON "public"."payments"("tenantId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_dueDate_idx" ON "public"."payments"("dueDate");

-- CreateIndex
CREATE INDEX "maintenance_tickets_propertyId_idx" ON "public"."maintenance_tickets"("propertyId");

-- CreateIndex
CREATE INDEX "maintenance_tickets_tenantId_idx" ON "public"."maintenance_tickets"("tenantId");

-- CreateIndex
CREATE INDEX "maintenance_tickets_status_idx" ON "public"."maintenance_tickets"("status");

-- CreateIndex
CREATE INDEX "maintenance_tickets_priority_idx" ON "public"."maintenance_tickets"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "rental_applications_applicationNumber_key" ON "public"."rental_applications"("applicationNumber");

-- CreateIndex
CREATE INDEX "rental_applications_propertyId_idx" ON "public"."rental_applications"("propertyId");

-- CreateIndex
CREATE INDEX "rental_applications_applicantId_idx" ON "public"."rental_applications"("applicantId");

-- CreateIndex
CREATE INDEX "rental_applications_status_idx" ON "public"."rental_applications"("status");

-- CreateIndex
CREATE INDEX "rental_applications_applicationNumber_idx" ON "public"."rental_applications"("applicationNumber");

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rental_applications" ADD CONSTRAINT "rental_applications_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rental_applications" ADD CONSTRAINT "rental_applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

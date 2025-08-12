/*
  Warnings:

  - A unique constraint covering the columns `[legacyId]` on the table `leases` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[legacyId]` on the table `maintenance_tickets` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[legacyId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[legacyId]` on the table `properties` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[legacyId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."leases" ADD COLUMN     "legacyId" TEXT;

-- AlterTable
ALTER TABLE "public"."maintenance_tickets" ADD COLUMN     "legacyId" TEXT;

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "legacyId" TEXT;

-- AlterTable
ALTER TABLE "public"."properties" ADD COLUMN     "legacyId" TEXT;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "legacyId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "leases_legacyId_key" ON "public"."leases"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_tickets_legacyId_key" ON "public"."maintenance_tickets"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_legacyId_key" ON "public"."payments"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "properties_legacyId_key" ON "public"."properties"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "users_legacyId_key" ON "public"."users"("legacyId");

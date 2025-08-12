/*
  Warnings:

  - The values [AVAILABLE,OCCUPIED,UNAVAILABLE] on the enum `PropertyStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `address` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `rent` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `properties` table. All the data in the column will be lost.
  - Added the required column `addressCity` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressState` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressStreet` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressZip` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `landlordId` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyType` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rentAmount` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `properties` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'STUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."RentPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PropertyStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'RENTED', 'MAINTENANCE');
ALTER TABLE "public"."properties" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."properties" ALTER COLUMN "status" TYPE "public"."PropertyStatus_new" USING ("status"::text::"public"."PropertyStatus_new");
ALTER TYPE "public"."PropertyStatus" RENAME TO "PropertyStatus_old";
ALTER TYPE "public"."PropertyStatus_new" RENAME TO "PropertyStatus";
DROP TYPE "public"."PropertyStatus_old";
ALTER TABLE "public"."properties" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."properties" DROP CONSTRAINT "properties_ownerId_fkey";

-- DropIndex
DROP INDEX "public"."properties_ownerId_idx";

-- AlterTable
ALTER TABLE "public"."properties" DROP COLUMN "address",
DROP COLUMN "city",
DROP COLUMN "ownerId",
DROP COLUMN "rent",
DROP COLUMN "state",
DROP COLUMN "zipCode",
ADD COLUMN     "addressCity" TEXT NOT NULL,
ADD COLUMN     "addressCountry" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "addressState" TEXT NOT NULL,
ADD COLUMN     "addressStreet" TEXT NOT NULL,
ADD COLUMN     "addressZip" TEXT NOT NULL,
ADD COLUMN     "amenities" JSONB,
ADD COLUMN     "availableFrom" TIMESTAMP(3),
ADD COLUMN     "availableTo" TIMESTAMP(3),
ADD COLUMN     "deposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "images" JSONB,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "landlordId" TEXT NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "petPolicy" JSONB,
ADD COLUMN     "propertyType" "public"."PropertyType" NOT NULL,
ADD COLUMN     "rentAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "rentCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "rentPeriod" "public"."RentPeriod" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "utilities" JSONB,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "properties_landlordId_idx" ON "public"."properties"("landlordId");

-- CreateIndex
CREATE INDEX "properties_isAvailable_idx" ON "public"."properties"("isAvailable");

-- CreateIndex
CREATE INDEX "properties_addressCity_addressState_idx" ON "public"."properties"("addressCity", "addressState");

-- CreateIndex
CREATE INDEX "properties_propertyType_idx" ON "public"."properties"("propertyType");

-- CreateIndex
CREATE INDEX "properties_rentAmount_idx" ON "public"."properties"("rentAmount");

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

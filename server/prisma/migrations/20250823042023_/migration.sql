-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "budgetMax" INTEGER,
ADD COLUMN     "budgetMin" INTEGER,
ADD COLUMN     "petPreferences" JSONB,
ADD COLUMN     "preferredBedrooms" INTEGER,
ADD COLUMN     "preferredLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "profilePreferences" JSONB,
ADD COLUMN     "profileUpdatedAt" TIMESTAMP(3);

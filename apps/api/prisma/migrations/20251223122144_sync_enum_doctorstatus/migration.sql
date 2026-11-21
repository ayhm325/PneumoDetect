/*
  Warnings:

  - The values [suspended] on the enum `DoctorStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isActive` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `isApproved` on the `Doctor` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DoctorStatus_new" AS ENUM ('pending', 'active', 'banned');
ALTER TABLE "public"."Doctor" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Doctor" ALTER COLUMN "status" TYPE "DoctorStatus_new" USING ("status"::text::"DoctorStatus_new");
ALTER TYPE "DoctorStatus" RENAME TO "DoctorStatus_old";
ALTER TYPE "DoctorStatus_new" RENAME TO "DoctorStatus";
DROP TYPE "public"."DoctorStatus_old";
ALTER TABLE "Doctor" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- DropIndex
DROP INDEX "Activity_createdAt_idx";

-- DropIndex
DROP INDEX "Activity_userId_idx";

-- DropIndex
DROP INDEX "Appointment_createdAt_idx";

-- DropIndex
DROP INDEX "Appointment_doctorId_idx";

-- DropIndex
DROP INDEX "Appointment_isDeleted_idx";

-- DropIndex
DROP INDEX "Appointment_patientId_idx";

-- DropIndex
DROP INDEX "Appointment_status_idx";

-- DropIndex
DROP INDEX "ChangeRequest_isDeleted_idx";

-- DropIndex
DROP INDEX "ChangeRequest_reviewedById_idx";

-- DropIndex
DROP INDEX "ChangeRequest_status_idx";

-- DropIndex
DROP INDEX "ChangeRequest_userId_idx";

-- DropIndex
DROP INDEX "Notification_isDeleted_idx";

-- DropIndex
DROP INDEX "Notification_userId_idx";

-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "isActive",
DROP COLUMN "isApproved",
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "isActive" SET DEFAULT false;

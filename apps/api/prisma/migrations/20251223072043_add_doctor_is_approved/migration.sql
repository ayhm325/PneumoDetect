/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `ChangeRequest` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `ChangeRequest` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `profilePictureUrl` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosis` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `recordDate` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `treatment` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContact` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Billing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DoctorSpecialty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Specialty` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[phone]` on the table `Doctor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `Doctor` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `aiResult` to the `MedicalRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `confidenceScore` to the `MedicalRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `MedicalRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AiResult" AS ENUM ('POSITIVE', 'NEGATIVE');

-- DropForeignKey
ALTER TABLE "Billing" DROP CONSTRAINT "Billing_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "Billing" DROP CONSTRAINT "Billing_patientId_fkey";

-- DropForeignKey
ALTER TABLE "DoctorSpecialty" DROP CONSTRAINT "DoctorSpecialty_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "DoctorSpecialty" DROP CONSTRAINT "DoctorSpecialty_specialtyId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalRecord" DROP CONSTRAINT "MedicalRecord_doctorId_fkey";

-- DropIndex
DROP INDEX "Doctor_userId_idx";

-- DropIndex
DROP INDEX "Doctor_userId_key";

-- DropIndex
DROP INDEX "MedicalRecord_doctorId_idx";

-- DropIndex
DROP INDEX "MedicalRecord_isDeleted_idx";

-- DropIndex
DROP INDEX "MedicalRecord_patientId_recordDate_idx";

-- DropIndex
DROP INDEX "Patient_userId_idx";

-- DropIndex
DROP INDEX "Patient_userId_key";

-- DropIndex
DROP INDEX "User_createdAt_idx";

-- DropIndex
DROP INDEX "User_isDeleted_idx";

-- AlterTable
ALTER TABLE "Activity" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy",
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ChangeRequest" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy",
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "bio",
DROP COLUMN "createdBy",
DROP COLUMN "isDeleted",
DROP COLUMN "profilePictureUrl",
DROP COLUMN "updatedBy",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "userId" DROP DEFAULT,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "isActive" SET DEFAULT true;

-- AlterTable
ALTER TABLE "MedicalRecord" DROP COLUMN "createdBy",
DROP COLUMN "diagnosis",
DROP COLUMN "isDeleted",
DROP COLUMN "notes",
DROP COLUMN "recordDate",
DROP COLUMN "treatment",
DROP COLUMN "updatedBy",
ADD COLUMN     "aiResult" "AiResult" NOT NULL,
ADD COLUMN     "confidenceScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "doctorNotes" TEXT,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "reviewedByDoctor" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "doctorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy",
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "address",
DROP COLUMN "createdBy",
DROP COLUMN "dateOfBirth",
DROP COLUMN "emergencyContact",
DROP COLUMN "isDeleted",
DROP COLUMN "updatedBy",
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "userId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdBy",
DROP COLUMN "isDeleted",
DROP COLUMN "updatedBy",
ALTER COLUMN "id" DROP DEFAULT;

-- DropTable
DROP TABLE "Billing";

-- DropTable
DROP TABLE "DoctorSpecialty";

-- DropTable
DROP TABLE "Specialty";

-- DropEnum
DROP TYPE "BillingStatus";

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_phone_key" ON "Doctor"("phone");

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

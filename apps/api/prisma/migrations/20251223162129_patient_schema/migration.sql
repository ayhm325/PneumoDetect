/*
  Warnings:

  - The primary key for the `Patient` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[userId]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Patient` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('active', 'suspended');
-- NOTE: This migration file has been adjusted to be safe for an existing non-empty Patient table.
-- We add new columns as nullable and avoid changing the primary key or existing foreign keys.

-- AlterTable: add new nullable columns (do not change primary key yet)
ALTER TABLE "Patient"
  ADD COLUMN "bloodType" TEXT,
  ADD COLUMN "doctorId" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "fullName" TEXT,
  ADD COLUMN "id" TEXT,
  ADD COLUMN "joinDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "lastVisit" TIMESTAMP(3),
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "status" "PatientStatus" DEFAULT 'active';

-- Note: We'll populate `id`, `email`, and `fullName` in a separate backfill step before making them required and switching primary key.

-- Add doctor foreign key now (safe as it's nullable)
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- Do NOT alter Appointment/MedicalRecord foreign keys yet; we'll switch them after backfilling and switching Patient primary key.

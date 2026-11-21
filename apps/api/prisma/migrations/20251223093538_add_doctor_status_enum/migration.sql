-- CreateEnum
CREATE TYPE "DoctorStatus" AS ENUM ('active', 'suspended', 'banned');

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "status" "DoctorStatus" NOT NULL DEFAULT 'active';

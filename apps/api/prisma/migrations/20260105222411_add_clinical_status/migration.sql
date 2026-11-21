-- CreateEnum
CREATE TYPE "ClinicalStatus" AS ENUM ('stable', 'critical', 'recovering');

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "clinicalStatus" "ClinicalStatus" NOT NULL DEFAULT 'stable';

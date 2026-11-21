-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "location" TEXT,
ADD COLUMN     "patientReason" TEXT;

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "clinic" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "clientKey" TEXT;

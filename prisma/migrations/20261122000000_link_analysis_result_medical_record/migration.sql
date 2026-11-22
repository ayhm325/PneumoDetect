-- AlterTable
ALTER TABLE "AnalysisResult" ADD COLUMN IF NOT EXISTS "patientId" TEXT,
ADD COLUMN IF NOT EXISTS "uploadedByUserId" TEXT,
ADD COLUMN IF NOT EXISTS "uploadedByRole" TEXT,
ADD COLUMN IF NOT EXISTS "probabilities" JSONB,
ADD COLUMN IF NOT EXISTS "needsReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NOT NULL DEFAULT 'pending_review',
ADD COLUMN IF NOT EXISTS "uploadNotes" TEXT;

-- AlterTable
ALTER TABLE "MedicalRecord" ADD COLUMN IF NOT EXISTS "analysisResultId" TEXT,
ADD COLUMN IF NOT EXISTS "uploadNotes" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AnalysisResult_patientId_createdAt_idx" ON "AnalysisResult"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AnalysisResult_uploadedByUserId_createdAt_idx" ON "AnalysisResult"("uploadedByUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MedicalRecord_analysisResultId_key" ON "MedicalRecord"("analysisResultId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MedicalRecord_analysisResultId_fkey'
  ) THEN
    ALTER TABLE "MedicalRecord"
      ADD CONSTRAINT "MedicalRecord_analysisResultId_fkey"
      FOREIGN KEY ("analysisResultId") REFERENCES "AnalysisResult"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

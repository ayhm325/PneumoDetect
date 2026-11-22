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

-- Step 1: Normalize stored /uploads/<file>?exp=...&sig=... URLs to permanent storage paths /uploads/<file>
UPDATE "AnalysisResult"
SET "imageUrl" = split_part("imageUrl", '?', 1)
WHERE "imageUrl" LIKE '/uploads/%?%';

UPDATE "MedicalRecord"
SET "imageUrl" = split_part("imageUrl", '?', 1)
WHERE "imageUrl" LIKE '/uploads/%?%';

-- Step 2: Safe 1-to-1 backfill of MedicalRecord.analysisResultId where imageUrl and patient ownership uniquely match
WITH unique_mr AS (
  SELECT split_part("imageUrl", '?', 1) AS norm_img
  FROM "MedicalRecord"
  WHERE "imageUrl" IS NOT NULL AND "imageUrl" <> ''
  GROUP BY split_part("imageUrl", '?', 1)
  HAVING COUNT(*) = 1
),
unique_ar AS (
  SELECT split_part("imageUrl", '?', 1) AS norm_img
  FROM "AnalysisResult"
  WHERE "imageUrl" IS NOT NULL AND "imageUrl" <> ''
  GROUP BY split_part("imageUrl", '?', 1)
  HAVING COUNT(*) = 1
),
matched_pairs AS (
  SELECT
    mr.id AS medical_record_id,
    ar.id AS analysis_result_id,
    mr."patientId" AS patient_id,
    mr."reviewedByDoctor" AS reviewed_by_doctor,
    ar."needsReview" AS needs_review
  FROM "MedicalRecord" mr
  JOIN "Patient" p ON p.id = mr."patientId"
  JOIN unique_mr umr ON umr.norm_img = split_part(mr."imageUrl", '?', 1)
  JOIN unique_ar uar ON uar.norm_img = split_part(mr."imageUrl", '?', 1)
  JOIN "AnalysisResult" ar ON split_part(ar."imageUrl", '?', 1) = split_part(mr."imageUrl", '?', 1)
  WHERE mr."analysisResultId" IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM "MedicalRecord" existing_mr WHERE existing_mr."analysisResultId" = ar.id
    )
    AND (
      ar."patientId" = mr."patientId"
      OR (ar."patientId" IS NULL AND p."userId" IS NOT NULL AND ar."userId" = p."userId")
    )
)
UPDATE "MedicalRecord" mr
SET "analysisResultId" = mp.analysis_result_id
FROM matched_pairs mp
WHERE mr.id = mp.medical_record_id;

-- Step 3: Sync patientId and reviewStatus on linked AnalysisResult rows
UPDATE "AnalysisResult" ar
SET
  "patientId" = mr."patientId",
  "reviewStatus" = CASE
    WHEN mr."reviewedByDoctor" = true THEN 'reviewed'
    WHEN ar."needsReview" = true THEN 'requires_review'
    ELSE 'pending_review'
  END
FROM "MedicalRecord" mr
WHERE mr."analysisResultId" = ar.id;

-- Step 4: Backfill AnalysisResult.patientId for unlinked rows where userId maps uniquely to 1 Patient
WITH unique_user_patient AS (
  SELECT "userId", MAX(id) AS patient_id
  FROM "Patient"
  WHERE "userId" IS NOT NULL
  GROUP BY "userId"
  HAVING COUNT(*) = 1
)
UPDATE "AnalysisResult" ar
SET "patientId" = uup.patient_id
FROM unique_user_patient uup
WHERE ar."patientId" IS NULL
  AND ar."userId" = uup."userId";

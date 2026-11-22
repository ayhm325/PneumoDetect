import { prisma, type PrismaClientLike } from "../../db/prisma.js";

export type BackfillReport = {
  totalAnalysisResults: number;
  totalMedicalRecords: number;
  alreadyLinkedCount: number;
  newlyLinkedCount: number;
  ambiguousSkippedCount: number;
  unmatchedMedicalRecordsCount: number;
  unmatchedAnalysisResultsCount: number;
  patientIdBackfilledCount: number;
  normalizedImageUrlsCount: number;
};

/**
 * Strips temporary query strings (e.g. ?exp=...&sig=...) from internal /uploads/<filename> URLs
 * to produce a permanent canonical storage reference.
 */
export function normalizeUploadStorageReference(rawUrl: string | null | undefined): string {
  const trimmed = typeof rawUrl === "string" ? rawUrl.trim() : "";
  if (!trimmed) return "";
  if (trimmed.startsWith("/uploads/")) {
    const qIndex = trimmed.indexOf("?");
    const cleanPath = qIndex >= 0 ? trimmed.slice(0, qIndex) : trimmed;
    const prefix = "/uploads/";
    const rest = cleanPath.slice(prefix.length);
    try {
      const decoded = decodeURIComponent(rest);
      if (!decoded || decoded.includes("/") || decoded.includes("\\") || decoded === "." || decoded === "..") {
        return cleanPath;
      }
      return `${prefix}${decoded}`;
    } catch {
      return cleanPath;
    }
  }
  return trimmed;
}

export function computeCanonicalReviewStatus(input: {
  reviewedByDoctor: boolean;
  needsReview: boolean;
}): "reviewed" | "requires_review" | "pending_review" {
  if (input.reviewedByDoctor) return "reviewed";
  if (input.needsReview) return "requires_review";
  return "pending_review";
}

type BackfillAnalysisRow = {
  id: string;
  userId: string;
  patientId: string | null;
  imageUrl: string;
  needsReview: boolean;
  reviewStatus: string;
  medicalRecord?: { id: string } | null;
};

type BackfillMedicalRow = {
  id: string;
  patientId: string;
  analysisResultId: string | null;
  imageUrl: string;
  reviewedByDoctor: boolean;
  patient?: { id: string; userId: string | null; doctorId: string | null } | null;
};

type BackfillPatientRow = {
  id: string;
  userId: string | null;
};

export async function backfillAnalysisAndMedicalRecords(
  db: PrismaClientLike = prisma,
): Promise<BackfillReport> {
  const [rawAnalysisRows, rawMedicalRows, rawPatientRows] = await Promise.all([
    db.analysisResult.findMany({
      include: {
        medicalRecord: { select: { id: true } },
      },
    }),
    db.medicalRecord.findMany({
      include: {
        patient: { select: { id: true, userId: true, doctorId: true } },
      },
    }),
    db.patient.findMany({
      select: { id: true, userId: true },
    }),
  ]);

  const analysisRows = rawAnalysisRows as unknown as BackfillAnalysisRow[];
  const medicalRows = rawMedicalRows as unknown as BackfillMedicalRow[];
  const patientRows = rawPatientRows as unknown as BackfillPatientRow[];

  // Build 1-to-1 userId -> patientId map (only if userId maps to a single Patient row)
  const patientsByUserId = new Map<string, string[]>();
  for (const p of patientRows) {
    if (!p.userId) continue;
    const list = patientsByUserId.get(p.userId) || [];
    list.push(p.id);
    patientsByUserId.set(p.userId, list);
  }

  // Index AnalysisResult and MedicalRecord by canonical normalized imageUrl
  const analysisByNormImg = new Map<string, typeof analysisRows>();
  for (const ar of analysisRows) {
    const normImg = normalizeUploadStorageReference(ar.imageUrl);
    if (!normImg) continue;
    const list = analysisByNormImg.get(normImg) || [];
    list.push(ar);
    analysisByNormImg.set(normImg, list);
  }

  const medicalByNormImg = new Map<string, typeof medicalRows>();
  for (const mr of medicalRows) {
    const normImg = normalizeUploadStorageReference(mr.imageUrl);
    if (!normImg) continue;
    const list = medicalByNormImg.get(normImg) || [];
    list.push(mr);
    medicalByNormImg.set(normImg, list);
  }

  const linkedAnalysisIds = new Set<string>();
  let alreadyLinkedCount = 0;
  for (const mr of medicalRows) {
    if (mr.analysisResultId) {
      linkedAnalysisIds.add(mr.analysisResultId);
      alreadyLinkedCount += 1;
    }
  }

  let newlyLinkedCount = 0;
  let ambiguousSkippedCount = 0;
  let unmatchedMedicalRecordsCount = 0;
  let patientIdBackfilledCount = 0;
  let normalizedImageUrlsCount = 0;

  // Step 1: Normalize expiring imageUrl in MedicalRecord and link unambiguous 1-to-1 records
  for (const mr of medicalRows) {
    const normImg = normalizeUploadStorageReference(mr.imageUrl);
    const needsUrlNorm = Boolean(normImg && mr.imageUrl !== normImg);

    if (mr.analysisResultId) {
      if (needsUrlNorm) {
        await db.medicalRecord.update({
          where: { id: mr.id },
          data: { imageUrl: normImg },
        });
        normalizedImageUrlsCount += 1;
      }
      // Ensure linked AnalysisResult has consistent patientId & reviewStatus
      const linkedAr = analysisRows.find((a) => a.id === mr.analysisResultId);
      if (linkedAr) {
        const expectedStatus = computeCanonicalReviewStatus({
          reviewedByDoctor: Boolean(mr.reviewedByDoctor),
          needsReview: Boolean(linkedAr.needsReview),
        });
        const arNormImg = normalizeUploadStorageReference(linkedAr.imageUrl);
        const arUpdates: Record<string, unknown> = {};
        if (linkedAr.patientId !== mr.patientId) {
          arUpdates.patientId = mr.patientId;
          linkedAr.patientId = mr.patientId;
          patientIdBackfilledCount += 1;
        }
        if (linkedAr.reviewStatus !== expectedStatus) {
          arUpdates.reviewStatus = expectedStatus;
          linkedAr.reviewStatus = expectedStatus;
        }
        if (arNormImg && linkedAr.imageUrl !== arNormImg) {
          arUpdates.imageUrl = arNormImg;
          linkedAr.imageUrl = arNormImg;
          normalizedImageUrlsCount += 1;
        }
        if (Object.keys(arUpdates).length > 0) {
          await db.analysisResult.update({
            where: { id: linkedAr.id },
            data: arUpdates,
          });
        }
      }
      continue;
    }

    if (!normImg) {
      unmatchedMedicalRecordsCount += 1;
      continue;
    }

    const mrsWithSameImage = medicalByNormImg.get(normImg) || [];
    const arsWithSameImage = analysisByNormImg.get(normImg) || [];

    // Filter candidate AnalysisResults that match patient ownership and are not yet linked
    const ownershipMatchedArs = arsWithSameImage.filter((ar) => {
      if (linkedAnalysisIds.has(ar.id) || ar.medicalRecord?.id) return false;
      if (ar.patientId && ar.patientId === mr.patientId) return true;
      if (!ar.patientId && mr.patient?.userId && ar.userId === mr.patient.userId) return true;
      return false;
    });

    if (arsWithSameImage.length === 0 || ownershipMatchedArs.length === 0) {
      unmatchedMedicalRecordsCount += 1;
      if (needsUrlNorm) {
        await db.medicalRecord.update({
          where: { id: mr.id },
          data: { imageUrl: normImg },
        });
        normalizedImageUrlsCount += 1;
      }
      continue;
    }

    // Strict 1-to-1 check: must be unique across both MedicalRecord and AnalysisResult for this image
    if (mrsWithSameImage.length > 1 || arsWithSameImage.length > 1 || ownershipMatchedArs.length !== 1) {
      ambiguousSkippedCount += 1;
      if (needsUrlNorm) {
        await db.medicalRecord.update({
          where: { id: mr.id },
          data: { imageUrl: normImg },
        });
        normalizedImageUrlsCount += 1;
      }
      continue;
    }

    const matchedAr = ownershipMatchedArs[0];
    const expectedStatus = computeCanonicalReviewStatus({
      reviewedByDoctor: Boolean(mr.reviewedByDoctor),
      needsReview: Boolean(matchedAr.needsReview),
    });

    await db.medicalRecord.update({
      where: { id: mr.id },
      data: {
        analysisResultId: matchedAr.id,
        ...(needsUrlNorm ? { imageUrl: normImg } : {}),
      },
    });
    if (needsUrlNorm) normalizedImageUrlsCount += 1;

    const arNormImg = normalizeUploadStorageReference(matchedAr.imageUrl);
    const arUrlChanged = Boolean(arNormImg && matchedAr.imageUrl !== arNormImg);
    const patientIdChanged = matchedAr.patientId !== mr.patientId;

    await db.analysisResult.update({
      where: { id: matchedAr.id },
      data: {
        patientId: mr.patientId,
        reviewStatus: expectedStatus,
        ...(arUrlChanged ? { imageUrl: arNormImg } : {}),
      },
    });

    matchedAr.patientId = mr.patientId;
    matchedAr.reviewStatus = expectedStatus;
    if (arUrlChanged) {
      matchedAr.imageUrl = arNormImg;
      normalizedImageUrlsCount += 1;
    }
    if (patientIdChanged) {
      patientIdBackfilledCount += 1;
    }

    linkedAnalysisIds.add(matchedAr.id);
    newlyLinkedCount += 1;
  }

  // Step 2: Backfill patientId & normalize imageUrl on remaining unlinked AnalysisResult rows
  let unmatchedAnalysisResultsCount = 0;
  for (const ar of analysisRows) {
    const isLinked = linkedAnalysisIds.has(ar.id);
    if (!isLinked) {
      unmatchedAnalysisResultsCount += 1;
    }

    const arNormImg = normalizeUploadStorageReference(ar.imageUrl);
    const needsUrlNorm = Boolean(arNormImg && ar.imageUrl !== arNormImg);
    const updates: Record<string, unknown> = {};

    if (needsUrlNorm) {
      updates.imageUrl = arNormImg;
      normalizedImageUrlsCount += 1;
    }

    if (!ar.patientId) {
      const candidatePatientIds = patientsByUserId.get(ar.userId) || [];
      if (candidatePatientIds.length === 1) {
        updates.patientId = candidatePatientIds[0];
        patientIdBackfilledCount += 1;
      }
    }

    const expectedStatus = isLinked
      ? ar.reviewStatus
      : computeCanonicalReviewStatus({
          reviewedByDoctor: ar.reviewStatus === "reviewed",
          needsReview: Boolean(ar.needsReview),
        });
    if (ar.reviewStatus !== expectedStatus) {
      updates.reviewStatus = expectedStatus;
    }

    if (Object.keys(updates).length > 0) {
      await db.analysisResult.update({
        where: { id: ar.id },
        data: updates,
      });
    }
  }

  return {
    totalAnalysisResults: analysisRows.length,
    totalMedicalRecords: medicalRows.length,
    alreadyLinkedCount,
    newlyLinkedCount,
    ambiguousSkippedCount,
    unmatchedMedicalRecordsCount,
    unmatchedAnalysisResultsCount,
    patientIdBackfilledCount,
    normalizedImageUrlsCount,
  };
}

export function resolveCanonicalReviewStatus(record) {
  if (!record || typeof record !== "object") {
    return "pending_review";
  }
  const explicit = String(record.reviewStatus || record.status || "").trim().toLowerCase();
  if (Boolean(record.reviewedByDoctor) || explicit === "reviewed" || explicit === "completed" || explicit === "ready") {
    return "reviewed";
  }
  if (Boolean(record.needsReview ?? record.needs_review) || explicit === "requires_review") {
    return "requires_review";
  }
  return "pending_review";
}

/**
 * Clinical urgency is strictly separate from AI screening prediction (NORMAL/PNEUMONIA)
 * and model confidence. A record is only marked "urgent" when an explicit physician
 * clinical status decision of "critical" is stored on the patient/record.
 */
export function resolveClinicalPriority(record) {
  if (!record || typeof record !== "object") {
    return "normal";
  }
  const rawClinical = String(
    record.clinicalStatus ||
      record.patientClinicalStatus ||
      record.patient?.clinicalStatus ||
      "",
  )
    .trim()
    .toLowerCase();
  return rawClinical === "critical" ? "urgent" : "normal";
}

export function getReviewStatusLabel(reviewStatus, locale = "ar") {
  const isAr = String(locale || "").toLowerCase().startsWith("ar");
  const normalized = String(reviewStatus || "").trim().toLowerCase();
  if (normalized === "reviewed" || normalized === "completed" || normalized === "ready") {
    return isAr ? "تمت مراجعة الطبيب" : "Reviewed by Physician";
  }
  if (normalized === "requires_review") {
    return isAr ? "تحتاج مراجعة الطبيب" : "Needs Physician Review";
  }
  return isAr ? "نتيجة أولية — بانتظار المراجعة" : "Preliminary — Pending Review";
}

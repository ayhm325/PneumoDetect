"use client";

import { useTranslations } from "@/lib/compat/intl";

export default function AnalysisStatusBadge({ status }) {
  const t = useTranslations("adminAnalyses");
  const ui = useTranslations("ui");

  const placeholder = ui("placeholder");

  const labels = {
    completed: t("statuses.completed"),
    pending: t("statuses.pending"),
    reviewing: t("statuses.reviewing"),
    failed: t("statuses.failed"),
    success: t("statuses.success"),
  };

  const normalizeStatus = (value) => {
    if (!value) return null;
    if (typeof value !== "string") return null;

    const lower = value.toLowerCase();
    if (lower in labels) return lower;

    // Legacy localized values: match against translated labels (no hardcoded strings)
    for (const key of Object.keys(labels)) {
      if (value === labels[key]) return key;
    }

    return null;
  };

  let color = "bg-(--ui-surface-2) text-foreground border-(--ui-border)";

  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "completed")
    color =
      "bg-(--ui-success-bg) text-(--ui-success) border-(--ui-success-border)";
  if (normalizedStatus === "pending")
    color =
      "bg-(--ui-warning-bg) text-(--ui-warning) border-(--ui-warning-border)";
  if (normalizedStatus === "reviewing")
    color =
      "bg-(--ui-warning-bg) text-(--ui-warning) border-(--ui-warning-border)";
  if (normalizedStatus === "failed")
    color =
      "bg-(--ui-danger-bg) text-(--ui-danger) border-(--ui-danger-border)";
  if (normalizedStatus === "success")
    color =
      "bg-(--ui-success-bg) text-(--ui-success) border-(--ui-success-border)";

  const label = normalizedStatus ? labels[normalizedStatus] : placeholder;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${color}`}
    >
      {label}
    </span>
  );
}

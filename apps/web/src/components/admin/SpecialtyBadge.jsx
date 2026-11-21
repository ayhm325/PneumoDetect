"use client";

import { useTranslations } from "@/lib/compat/intl";

export default function SpecialtyBadge({ specialty }) {
  const t = useTranslations("DoctorsManagement");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");
  let color = "bg-(--ui-surface-2) text-foreground border-(--ui-border)";
  let label = placeholder;

  const normalized = String(specialty || "")
    .trim()
    .toLowerCase();

  const specialtyKey =
    normalized === "radiology"
      ? "radiology"
      : normalized === "pulmonology"
        ? "pulmonology"
        : normalized === "orthopedics"
          ? "orthopedics"
          : null;

  if (specialtyKey === "radiology") {
    color =
      "bg-(--ui-warning-bg) text-(--ui-warning) border-(--ui-warning-border)";
    label = t("specialties.radiology");
  }
  if (specialtyKey === "pulmonology") {
    color =
      "bg-(--ui-danger-bg) text-(--ui-danger) border-(--ui-danger-border)";
    label = t("specialties.pulmonology");
  }
  if (specialtyKey === "orthopedics") {
    color =
      "bg-(--ui-success-bg) text-(--ui-success) border-(--ui-success-border)";
    label = t("specialties.orthopedics");
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${color}`}
    >
      {label}
    </span>
  );
}
"use client";

import { useTranslations } from "@/lib/compat/intl";

export default function RolesBadge({ role }) {
  const t = useTranslations("adminUsers");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");
  let color = "bg-(--ui-surface-2) text-foreground border border-(--ui-border)";
  let label = placeholder;

  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  const roleKey =
    normalized === "admin"
      ? "admin"
      : normalized === "doctor"
        ? "doctor"
        : normalized === "patient"
          ? "patient"
          : null;

  if (roleKey === "admin") {
    color =
      "bg-(--ui-info-bg) text-(--ui-info) border border-(--ui-info-border)";
    label = t("roles.admin");
  }
  if (roleKey === "doctor") {
    color =
      "bg-(--ui-warning-bg) text-foreground border border-(--ui-warning-border)";
    label = t("roles.doctor");
  }
  if (roleKey === "patient") {
    color =
      "bg-(--ui-success-bg) text-foreground border border-(--ui-success-border)";
    label = t("roles.patient");
  }
  return (
    <span className={`px-3 py-1 rounded-full font-bold text-sm ${color}`}>
      {label}
    </span>
  );
}
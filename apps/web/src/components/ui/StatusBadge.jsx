// StatusBadge: شارة حالة عامة للاستخدام في جميع أجزاء التطبيق
// يمكنك توسيع الحالات حسب الحاجة
import React from "react";
import { useTranslations } from "@/lib/compat/intl";

const STATUS_MAP = {
  ready: {
    labelKey: "ready",
    className:
      "bg-[var(--ui-success-bg)] text-[var(--ui-success-foreground)] ring-[var(--ui-success-border)]",
  },
  processing: {
    labelKey: "processing",
    className:
      "bg-[var(--ui-warning-bg)] text-[var(--ui-warning-foreground)] ring-[var(--ui-warning-border)]",
  },
  reviewed: {
    labelKey: "reviewed",
    className:
      "bg-[var(--ui-success-bg)] text-[var(--ui-success-foreground)] ring-[var(--ui-success-border)]",
  },
  pending: {
    labelKey: "pending",
    className:
      "bg-[var(--ui-warning-bg)] text-[var(--ui-warning-foreground)] ring-[var(--ui-warning-border)]",
  },
  confirmed: {
    labelKey: "confirmed",
    className:
      "bg-[var(--ui-success-bg)] text-[var(--ui-success-foreground)] ring-[var(--ui-success-border)]",
  },
  online: {
    labelKey: "online",
    className:
      "bg-[var(--ui-success-bg)] text-[var(--ui-success-foreground)] ring-[var(--ui-success-border)]",
  },
  offline: {
    labelKey: "offline",
    className:
      "bg-[var(--ui-surface-2)] text-[var(--ui-muted-foreground)] ring-[var(--ui-border)]",
  },
  // add more statuses as needed
};

export default function StatusBadge({ status, t }) {
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  const defaultFallback = {
    labelKey: null,
    className:
      "bg-[var(--ui-surface-2)] text-[var(--ui-muted-foreground)] ring-[var(--ui-border)]",
  };
  const { labelKey, className } = STATUS_MAP[status] || defaultFallback;
  const display = labelKey
    ? typeof t === "function"
      ? t(labelKey)
      : ui(`status.${labelKey}`)
    : placeholder;
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-sm ring-1 ring-inset ${className}`}
    >
      {display}
    </span>
  );
}
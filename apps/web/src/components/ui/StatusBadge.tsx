import React from "react";
import { useTranslations } from "@/lib/compat/intl";

export type ClinicalStatus =
  | "pending"
  | "active"
  | "inactive"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled"
  | "failed"
  | "processing"
  | "reviewed"
  | "ready"
  | "confirmed"
  | "online"
  | "offline";

interface StatusConfig {
  labelKey: string;
  className: string;
  dotClassName: string;
  pulse?: boolean;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  active: {
    labelKey: "active",
    className: "bg-[var(--ui-success-bg)] text-[var(--ui-success-foreground)] border-[var(--ui-success-border)]",
    dotClassName: "bg-[var(--ui-success)]",
    pulse: true,
  },
  online: {
    labelKey: "online",
    className: "bg-[var(--ui-success-bg)] text-[var(--ui-success-foreground)] border-[var(--ui-success-border)]",
    dotClassName: "bg-[var(--ui-success)]",
    pulse: true,
  },
  ready: {
    labelKey: "ready",
    className: "bg-[var(--ui-success-bg)] text-[var(--ui-success-foreground)] border-[var(--ui-success-border)]",
    dotClassName: "bg-[var(--ui-success)]",
  },
  reviewed: {
    labelKey: "reviewed",
    className: "bg-[var(--ui-success-bg)] text-[var(--ui-success-foreground)] border-[var(--ui-success-border)]",
    dotClassName: "bg-[var(--ui-success)]",
  },
  confirmed: {
    labelKey: "confirmed",
    className: "bg-[var(--ui-success-bg)] text-[var(--ui-success-foreground)] border-[var(--ui-success-border)]",
    dotClassName: "bg-[var(--ui-success)]",
  },
  approved: {
    labelKey: "approved",
    className: "bg-[var(--ui-success-bg)] text-[var(--ui-success-foreground)] border-[var(--ui-success-border)]",
    dotClassName: "bg-[var(--ui-success)]",
  },
  completed: {
    labelKey: "completed",
    className: "bg-[var(--ui-info-bg)] text-[var(--ui-info-foreground)] border-[var(--ui-info-border)]",
    dotClassName: "bg-[var(--ui-info)]",
  },
  processing: {
    labelKey: "processing",
    className: "bg-[var(--ui-warning-bg)] text-[var(--ui-warning-foreground)] border-[var(--ui-warning-border)]",
    dotClassName: "bg-[var(--ui-warning)]",
    pulse: true,
  },
  pending: {
    labelKey: "pending",
    className: "bg-[var(--ui-warning-bg)] text-[var(--ui-warning-foreground)] border-[var(--ui-warning-border)]",
    dotClassName: "bg-[var(--ui-warning)]",
  },
  inactive: {
    labelKey: "inactive",
    className: "bg-[var(--ui-surface-2)] text-[var(--ui-muted-foreground)] border-[var(--ui-border)]",
    dotClassName: "bg-[var(--ui-muted)]",
  },
  offline: {
    labelKey: "offline",
    className: "bg-[var(--ui-surface-2)] text-[var(--ui-muted-foreground)] border-[var(--ui-border)]",
    dotClassName: "bg-[var(--ui-muted)]",
  },
  cancelled: {
    labelKey: "cancelled",
    className: "bg-[var(--ui-surface-2)] text-[var(--ui-muted-foreground)] border-[var(--ui-border)]",
    dotClassName: "bg-[var(--ui-muted)]",
  },
  rejected: {
    labelKey: "rejected",
    className: "bg-[var(--ui-danger-bg)] text-[var(--ui-danger-foreground)] border-[var(--ui-danger-border)]",
    dotClassName: "bg-[var(--ui-danger)]",
  },
  failed: {
    labelKey: "failed",
    className: "bg-[var(--ui-danger-bg)] text-[var(--ui-danger-foreground)] border-[var(--ui-danger-border)]",
    dotClassName: "bg-[var(--ui-danger)]",
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  labelKey: "unknown",
  className: "bg-[var(--ui-surface-2)] text-[var(--ui-muted-foreground)] border-[var(--ui-border)]",
  dotClassName: "bg-[var(--ui-muted)]",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  t?: (key: string) => string;
  size?: "sm" | "md";
  showDot?: boolean;
  className?: string;
}

export default function StatusBadge({
  status,
  label,
  t,
  size = "md",
  showDot = true,
  className = "",
}: StatusBadgeProps) {
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  const normalizedStatus = String(status || "").toLowerCase().replace(/[\s-]/g, "_");
  const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG[status] || DEFAULT_CONFIG;

  const displayText =
    label ||
    (typeof t === "function"
      ? t(config.labelKey)
      : config.labelKey !== "unknown"
        ? ui(`status.${config.labelKey}`) || status
        : status || placeholder);

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs gap-1.5"
      : "px-2.5 py-1 text-xs sm:text-[13px] font-semibold gap-2";

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs transition-colors ${sizeClasses} ${config.className} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {config.pulse && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.dotClassName}`}
            />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dotClassName}`} />
        </span>
      )}
      <span className="truncate">{displayText}</span>
    </span>
  );
}

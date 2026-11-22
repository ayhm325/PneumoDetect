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
    className: "bg-[var(--pd-moss-soft)] text-[var(--pd-success)] border-[color-mix(in_srgb,var(--pd-success)_32%,transparent)]",
    dotClassName: "bg-[var(--pd-success)]",
    pulse: true,
  },
  online: {
    labelKey: "online",
    className: "bg-[var(--pd-moss-soft)] text-[var(--pd-success)] border-[color-mix(in_srgb,var(--pd-success)_32%,transparent)]",
    dotClassName: "bg-[var(--pd-success)]",
    pulse: true,
  },
  ready: {
    labelKey: "ready",
    className: "bg-[var(--pd-moss-soft)] text-[var(--pd-success)] border-[color-mix(in_srgb,var(--pd-success)_32%,transparent)]",
    dotClassName: "bg-[var(--pd-success)]",
  },
  reviewed: {
    labelKey: "reviewed",
    className: "bg-[var(--pd-moss-soft)] text-[var(--pd-success)] border-[color-mix(in_srgb,var(--pd-success)_32%,transparent)]",
    dotClassName: "bg-[var(--pd-success)]",
  },
  confirmed: {
    labelKey: "confirmed",
    className: "bg-[var(--pd-moss-soft)] text-[var(--pd-success)] border-[color-mix(in_srgb,var(--pd-success)_32%,transparent)]",
    dotClassName: "bg-[var(--pd-success)]",
  },
  approved: {
    labelKey: "approved",
    className: "bg-[var(--pd-moss-soft)] text-[var(--pd-success)] border-[color-mix(in_srgb,var(--pd-success)_32%,transparent)]",
    dotClassName: "bg-[var(--pd-success)]",
  },
  completed: {
    labelKey: "completed",
    className: "bg-[var(--pd-orchid-soft)] text-[var(--pd-orchid)] border-[color-mix(in_srgb,var(--pd-orchid)_32%,transparent)]",
    dotClassName: "bg-[var(--pd-orchid)]",
  },
  processing: {
    labelKey: "processing",
    className: "bg-[var(--pd-marigold-soft)] text-[var(--pd-marigold)] border-[color-mix(in_srgb,var(--pd-marigold)_34%,transparent)]",
    dotClassName: "bg-[var(--pd-marigold)]",
    pulse: true,
  },
  pending: {
    labelKey: "pending",
    className: "bg-[var(--pd-marigold-soft)] text-[var(--pd-marigold)] border-[color-mix(in_srgb,var(--pd-marigold)_34%,transparent)]",
    dotClassName: "bg-[var(--pd-marigold)]",
  },
  inactive: {
    labelKey: "inactive",
    className: "bg-[var(--pd-canvas-raised)] text-[var(--pd-text-muted)] border-[var(--pd-line)]",
    dotClassName: "bg-[var(--pd-text-muted)]",
  },
  offline: {
    labelKey: "offline",
    className: "bg-[var(--pd-canvas-raised)] text-[var(--pd-text-muted)] border-[var(--pd-line)]",
    dotClassName: "bg-[var(--pd-text-muted)]",
  },
  cancelled: {
    labelKey: "cancelled",
    className: "bg-[var(--pd-canvas-raised)] text-[var(--pd-text-muted)] border-[var(--pd-line)]",
    dotClassName: "bg-[var(--pd-text-muted)]",
  },
  rejected: {
    labelKey: "rejected",
    className: "bg-[var(--pd-coral-soft)] text-[var(--pd-coral)] border-[color-mix(in_srgb,var(--pd-coral)_34%,transparent)]",
    dotClassName: "bg-[var(--pd-coral)]",
  },
  failed: {
    labelKey: "failed",
    className: "bg-[var(--pd-coral-soft)] text-[var(--pd-coral)] border-[color-mix(in_srgb,var(--pd-coral)_34%,transparent)]",
    dotClassName: "bg-[var(--pd-coral)]",
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  labelKey: "unknown",
  className: "bg-[var(--pd-canvas-raised)] text-[var(--pd-text-muted)] border-[var(--pd-line)]",
  dotClassName: "bg-[var(--pd-text-muted)]",
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
      ? "px-2.5 py-0.5 text-xs gap-1.5"
      : "px-3 py-1 text-xs sm:text-[13px] font-medium gap-2";

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${sizeClasses} ${config.className} ${className}`}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${config.dotClassName} ${config.pulse ? "pd-breathe" : ""}`}
        />
      )}
      <span className="truncate">{displayText}</span>
    </span>
  );
}

import React from "react";
import { Card } from "./Card";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  tone?: "primary" | "info" | "secondary" | "success" | "warning" | "danger";
}

const VALUE_TONE_MAP: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "text-[var(--ui-foreground)]",
  info: "text-[var(--ui-foreground)]",
  secondary: "text-[var(--ui-foreground)]",
  success: "text-[var(--ui-success)]",
  warning: "text-[var(--ui-warning)]",
  danger: "text-[var(--ui-danger)]",
};

const ICON_BOX_TONE_MAP: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary:
    "bg-[var(--ui-info-bg)] text-[var(--color-primary)] border-[var(--ui-info-border)]",
  info:
    "bg-[var(--ui-info-bg)] text-[var(--ui-info)] border-[var(--ui-info-border)]",
  secondary:
    "bg-[var(--ui-surface-2)] text-[var(--color-secondary)] border-[var(--ui-border)]",
  success:
    "bg-[var(--ui-success-bg)] text-[var(--ui-success)] border-[var(--ui-success-border)]",
  warning:
    "bg-[var(--ui-warning-bg)] text-[var(--ui-warning)] border-[var(--ui-warning-border)]",
  danger:
    "bg-[var(--ui-danger-bg)] text-[var(--ui-danger)] border-[var(--ui-danger-border)]",
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  tone = "primary",
}: StatCardProps) {
  return (
    <Card
      variant="interactive"
      size="sm"
      className="flex items-center justify-between gap-4"
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate text-xs font-semibold tracking-wide text-[var(--ui-muted-foreground)]">
          {label}
        </p>
        <p
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${VALUE_TONE_MAP[tone]}`}
        >
          {value}
        </p>
        {trend && (
          <p className="text-xs font-medium text-[var(--ui-muted-2)]">
            {trend}
          </p>
        )}
      </div>
      {icon && (
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-xl shadow-2xs ${ICON_BOX_TONE_MAP[tone]}`}
        >
          {icon}
        </div>
      )}
    </Card>
  );
}

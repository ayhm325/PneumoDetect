import React from "react";
import { Card } from "./Card";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  tone?: "primary" | "secondary" | "success" | "warning" | "danger";
}

const TONE_MAP: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "text-[var(--color-primary-500)]",
  secondary: "text-[var(--color-secondary-500)]",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  tone = "primary",
}: StatCardProps) {
  return (
    <Card className="flex items-start justify-between gap-4 p-5">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-[var(--ui-muted)]">{label}</p>
        <p className={`text-2xl font-extrabold tracking-tight ${TONE_MAP[tone]}`}>
          {value}
        </p>
        {trend && <p className="text-xs text-[var(--ui-muted-2)]">{trend}</p>}
      </div>
      {icon && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ui-surface-2)] text-lg text-[var(--color-primary-500)]">
          {icon}
        </div>
      )}
    </Card>
  );
}

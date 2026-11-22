import React from "react";
import clsx from "clsx";
import { Surface, type SurfaceShape } from "./Surface";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  tone?: "primary" | "info" | "secondary" | "success" | "warning" | "danger";
  shape?: SurfaceShape;
}

const VALUE_TONE_MAP: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "text-[var(--pd-text-primary)]",
  info: "text-[var(--pd-copper)]",
  secondary: "text-[var(--pd-text-primary)]",
  success: "text-[var(--pd-sage)]",
  warning: "text-[var(--pd-ochre)]",
  danger: "text-[var(--pd-clay)]",
};

const ORB_TONE_MAP: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "pd-orb--copper",
  info: "pd-orb--copper",
  secondary: "pd-orb--sage",
  success: "pd-orb--sage",
  warning: "pd-orb--ochre",
  danger: "pd-orb--clay",
};

const SHAPE_BY_TONE: Record<NonNullable<StatCardProps["tone"]>, SurfaceShape> = {
  primary: "editorial",
  info: "editorial",
  secondary: "asymmetric",
  success: "layered",
  warning: "slanted",
  danger: "organic",
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  tone = "primary",
  shape,
}: StatCardProps) {
  const resolvedShape = shape ?? SHAPE_BY_TONE[tone];

  if (resolvedShape === "orbital") {
    return (
      <div className="flex items-center gap-4 py-2">
        <div
          className={clsx(
            "pd-shape-orbital h-20 w-20 shrink-0 border border-[var(--pd-copper-border)] bg-[var(--pd-surface-inset)] shadow-[var(--pd-shadow-soft)]",
          )}
        >
          <span className={clsx("pd-metric-value !text-2xl", VALUE_TONE_MAP[tone])}>{value}</span>
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-[var(--pd-text-muted)]">
            {icon && <span className="text-sm text-[var(--pd-copper)]">{icon}</span>}
            <p className="truncate text-xs font-medium tracking-[var(--tracking-label)] uppercase">
              {label}
            </p>
          </div>
          {trend && <p className="text-xs text-[var(--pd-text-secondary)]">{trend}</p>}
        </div>
      </div>
    );
  }

  return (
    <Surface
      shape={resolvedShape}
      tone={resolvedShape === "editorial" ? "default" : "inset"}
      interactive={resolvedShape !== "editorial"}
      className={clsx(
        "flex items-center justify-between gap-4",
        resolvedShape === "editorial" ? "pt-4 pb-2" : "p-5",
      )}
    >
      <div className="min-w-0 space-y-2">
        <p className="truncate text-xs font-medium tracking-[var(--tracking-label)] uppercase text-[var(--pd-text-muted)]">
          {label}
        </p>
        <p className={clsx("pd-metric-value", VALUE_TONE_MAP[tone])}>{value}</p>
        {trend && <p className="text-xs text-[var(--pd-text-secondary)]">{trend}</p>}
      </div>
      {icon && <div className={clsx("pd-orb pd-shape-orbital", ORB_TONE_MAP[tone])}>{icon}</div>}
    </Surface>
  );
}

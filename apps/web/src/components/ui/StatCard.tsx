import React from "react";
import clsx from "clsx";
import { Surface, type SurfaceShape, type SurfaceTone } from "./Surface";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  tone?: "primary" | "info" | "secondary" | "success" | "warning" | "danger" | "crimson" | "parchment" | "sage" | "moss";
  shape?: SurfaceShape;
}

const SURFACE_TONE_MAP: Record<NonNullable<StatCardProps["tone"]>, SurfaceTone> = {
  primary: "crimson",
  crimson: "crimson",
  info: "moss",
  moss: "moss",
  secondary: "parchment",
  parchment: "parchment",
  success: "sage",
  sage: "sage",
  warning: "parchment",
  danger: "crimson",
};

const SHAPE_BY_TONE: Record<NonNullable<StatCardProps["tone"]>, SurfaceShape> = {
  primary: "asymmetric",
  crimson: "layered",
  info: "editorial",
  moss: "asymmetric",
  secondary: "organic",
  parchment: "slanted",
  success: "layered",
  sage: "organic",
  warning: "slanted",
  danger: "layered",
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
  const resolvedTone = SURFACE_TONE_MAP[tone];

  if (resolvedShape === "orbital") {
    return (
      <div className="flex items-center gap-4 py-2">
        <div className="pd-shape-orbital pd-tone-crimson h-20 w-20 shrink-0 border shadow-[var(--pd-shadow-soft)]">
          <span className="pd-metric-value !text-2xl text-[var(--pd-text-primary)]">{value}</span>
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-[var(--pd-text-muted)]">
            {icon && <span className="text-sm text-[var(--pd-parchment)]">{icon}</span>}
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
      tone={resolvedShape === "editorial" ? "default" : resolvedTone}
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
        <p className="pd-metric-value text-[var(--pd-text-primary)]">{value}</p>
        {trend && <p className="text-xs text-[var(--pd-text-secondary)]">{trend}</p>}
      </div>
      {icon && (
        <div className="pd-orb pd-shape-orbital border-[var(--pd-border-strong)] bg-black/15 text-[var(--pd-text-primary)]">
          {icon}
        </div>
      )}
    </Surface>
  );
}

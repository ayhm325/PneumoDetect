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

  return (
    <Surface
      shape={resolvedShape}
      tone={resolvedTone}
      interactive
      className="pd-metric pd-metric--editorial p-6"
    >
      <div className="pd-metric__header">
        <span className="pd-metric__label">{label}</span>
        {icon && <span className="pd-metric__icon">{icon}</span>}
      </div>
      <div className="pd-metric__value">{value}</div>
      {trend && <p className="pd-metric__description">{trend}</p>}
    </Surface>
  );
}

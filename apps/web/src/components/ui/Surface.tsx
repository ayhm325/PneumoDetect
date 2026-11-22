import React from "react";
import clsx from "clsx";

export type SurfaceShape =
  | "asymmetric"
  | "arch"
  | "slanted"
  | "orbital"
  | "layered"
  | "organic"
  | "capsule"
  | "editorial";

export type SurfaceTone =
  | "default"
  | "elevated"
  | "inset"
  | "copper"
  | "crimson"
  | "parchment"
  | "sage"
  | "moss";

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: SurfaceShape;
  tone?: SurfaceTone;
  interactive?: boolean;
  as?: "div" | "section" | "article" | "aside";
}

const SHAPE_CLASS: Record<SurfaceShape, string> = {
  asymmetric: "rounded-[24px] border border-[var(--pd-line)] bg-[var(--pd-neutral-surface)]",
  arch: "rounded-[24px] border border-[var(--pd-line)] bg-[var(--pd-neutral-surface)]",
  slanted: "rounded-[24px] border border-[var(--pd-line)] bg-[var(--pd-neutral-surface)]",
  orbital: "rounded-[24px] border border-[var(--pd-line)] bg-[var(--pd-neutral-surface)]",
  layered: "rounded-[24px] border border-[var(--pd-line)] bg-[var(--pd-neutral-surface)]",
  organic: "rounded-[24px] border border-[var(--pd-line)] bg-[var(--pd-neutral-surface)]",
  capsule: "rounded-full border border-[var(--pd-line)] bg-[var(--pd-neutral-surface)]",
  editorial: "pd-shape-editorial",
};

const TONE_CLASS: Record<SurfaceTone, string> = {
  default: "",
  elevated: "!bg-[var(--pd-neutral-raised)] border-[var(--pd-line-strong)]",
  inset: "!bg-[var(--pd-ink-deep)]",
  copper: "pd-card--red",
  crimson: "pd-card--red",
  parchment: "pd-card--cream",
  sage: "pd-card--sage",
  moss: "pd-card--olive",
};

export function Surface({
  shape = "asymmetric",
  tone = "default",
  interactive = false,
  as: Component = "div",
  className,
  children,
  ...props
}: SurfaceProps) {
  return (
    <Component
      className={clsx(
        "relative text-[var(--pd-text-primary)]",
        shape !== "editorial" && "shadow-[var(--pd-shadow-soft)]",
        SHAPE_CLASS[shape],
        shape !== "editorial" && "pd-card",
        shape !== "editorial" && TONE_CLASS[tone],
        interactive && "pd-panel--interactive",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Surface;

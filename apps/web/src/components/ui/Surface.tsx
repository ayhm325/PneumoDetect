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
  asymmetric: "pd-shape-asymmetric border border-[var(--pd-border)] bg-[var(--pd-surface)]",
  arch: "pd-shape-arch border border-[var(--pd-border)] bg-[var(--pd-surface)]",
  slanted: "pd-shape-slanted",
  orbital: "pd-shape-orbital border border-[var(--pd-border)] bg-[var(--pd-surface)]",
  layered: "pd-shape-layered border border-[var(--pd-border)] bg-[var(--pd-surface)]",
  organic: "pd-shape-organic border border-[var(--pd-border)] bg-[var(--pd-surface)]",
  capsule: "pd-shape-capsule border border-[var(--pd-border)] bg-[var(--pd-surface)]",
  editorial: "pd-shape-editorial",
};

const TONE_CLASS: Record<SurfaceTone, string> = {
  default: "",
  elevated: "!bg-[var(--pd-surface-2)] border-[var(--pd-border-strong)]",
  inset: "!bg-[var(--pd-surface-inset)]",
  copper: "pd-tone-crimson",
  crimson: "pd-tone-crimson",
  parchment: "pd-tone-parchment",
  sage: "pd-tone-sage",
  moss: "pd-tone-moss",
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

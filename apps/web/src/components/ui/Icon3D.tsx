import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import type { CardTone } from "./cards/types";

export interface Icon3DProps {
  icon: LucideIcon;
  tone?: CardTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: { box: "h-9 w-9 rounded-xl", icon: 17 },
  md: { box: "h-11 w-11 rounded-2xl", icon: 21 },
  lg: { box: "h-13 w-13 rounded-2xl", icon: 25 },
} as const;

/**
 * 3D claymorphic colored icon medallion with dual-layer SVG extrusion,
 * top specular reflection gloss, and inner duotone depth.
 */
export function Icon3D({
  icon: Icon,
  tone = "red",
  size = "md",
  className,
}: Icon3DProps) {
  const s = SIZE_MAP[size];

  return (
    <span
      className={clsx(
        "pd-icon-3d relative overflow-hidden",
        `pd-icon-3d--${tone}`,
        s.box,
        className,
      )}
    >
      {/* Top 3D glass specular reflection */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-1 top-0.5 h-1/3 rounded-t-full bg-white/22 blur-[0.5px]"
      />
      {/* Back 3D extruded shadow layer */}
      <Icon
        size={s.icon}
        strokeWidth={2.2}
        className="pointer-events-none absolute translate-x-[1px] translate-y-[1.5px] opacity-30"
        aria-hidden="true"
      />
      {/* Front crisp duotone 3D icon */}
      <Icon
        size={s.icon}
        strokeWidth={1.9}
        fill="currentColor"
        fillOpacity={0.18}
        className="pd-icon-3d__svg relative z-10"
        aria-hidden="true"
      />
    </span>
  );
}

import React from "react";
import clsx from "clsx";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={clsx(
        "animate-pulse rounded-xl bg-[linear-gradient(90deg,color-mix(in_srgb,var(--ui-surface-2)_78%,transparent),color-mix(in_srgb,var(--ui-surface-elevated)_82%,transparent),color-mix(in_srgb,var(--ui-surface-2)_78%,transparent))]",
        className,
      )}
    />
  );
}

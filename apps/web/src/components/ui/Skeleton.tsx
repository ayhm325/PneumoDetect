import React from "react";
import clsx from "clsx";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "text" | "rounded";
}

const baseSkeletonClass =
  "animate-pulse bg-[linear-gradient(90deg,color-mix(in_srgb,var(--ui-surface-2)_85%,transparent),color-mix(in_srgb,var(--ui-surface-elevated)_90%,transparent),color-mix(in_srgb,var(--ui-surface-2)_85%,transparent))]";

export function Skeleton({
  className,
  variant = "rounded",
  ...props
}: SkeletonProps) {
  const variantClass =
    variant === "circular"
      ? "rounded-full"
      : variant === "text"
        ? "rounded-md h-4"
        : variant === "rectangular"
          ? "rounded-none"
          : "rounded-xl";

  return (
    <div
      aria-hidden="true"
      className={clsx(baseSkeletonClass, variantClass, className)}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-2.5", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? "w-2/3" : "w-full"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-6 space-y-4 shadow-xs",
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton variant="text" className="h-4 w-1/3" />
          <Skeleton variant="text" className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export default Skeleton;

import React from "react";
import clsx from "clsx";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "text" | "rounded";
}

export function Skeleton({ className, variant = "rounded", ...props }: SkeletonProps) {
  const variantClass =
    variant === "circular"
      ? "rounded-full"
      : variant === "text"
        ? "h-4 rounded-md"
        : variant === "rectangular"
          ? "rounded-none"
          : "rounded-[var(--shape-control)]";

  return <div aria-hidden="true" className={clsx("pd-skeleton", variantClass, className)} {...props} />;
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={clsx("space-y-2.5", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" className={i === lines - 1 ? "w-2/3" : "w-full"} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={clsx("pd-panel pd-panel--leaf space-y-4 p-6", className)} aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton variant="text" className="h-4 w-1/3" />
          <Skeleton variant="text" className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export default Skeleton;

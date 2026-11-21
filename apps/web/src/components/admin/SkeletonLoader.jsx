import React from "react";

export default function SkeletonLoader({ height = 20, width = "100%" }) {
  const resolvedHeight = typeof height === "number" ? `${height}px` : height;
  const resolvedWidth = typeof width === "number" ? `${width}px` : width;

  return (
    <>
      <div className="skeleton animate-pulse rounded bg-(--ui-surface-2)/70" />
      <style jsx>{`
        .skeleton {
          height: ${resolvedHeight};
          width: ${resolvedWidth};
        }
      `}</style>
    </>
  );
}

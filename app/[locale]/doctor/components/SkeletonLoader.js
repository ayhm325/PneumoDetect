import React from "react";
import styles from "./SkeletonLoader.module.css";

export default function SkeletonLoader({
  height = 24,
  width = "100%",
  count = 1,
}) {
  const resolvedHeight =
    typeof height === "number" ? `${height}px` : (height ?? "24px");
  const resolvedWidth =
    typeof width === "number" ? `${width}px` : (width ?? "100%");

  return (
    <div>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`${styles.skeleton} skeletonItem`} />
      ))}
      <style jsx>{`
        .skeletonItem {
          height: ${resolvedHeight};
          width: ${resolvedWidth};
        }
      `}</style>
    </div>
  );
}

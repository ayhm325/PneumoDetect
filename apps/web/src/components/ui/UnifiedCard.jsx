import React from "react";
import { Card } from "./Card";

export default function UnifiedCard({
  title,
  badge,
  badgeTone = "primary",
  children,
  className = "",
  glass: _glass = false,
  ...props
}) {
  const badgeToneClass =
    badgeTone === "danger"
      ? "bg-[var(--ui-danger-bg)] text-[var(--ui-danger-foreground)] border-[var(--ui-danger-border)]"
      : badgeTone === "warning"
        ? "bg-[var(--ui-warning-bg)] text-[var(--ui-warning-foreground)] border-[var(--ui-warning-border)]"
        : badgeTone === "success"
          ? "bg-[var(--ui-success-bg)] text-[var(--ui-success-foreground)] border-[var(--ui-success-border)]"
          : "bg-[var(--color-primary-100)] text-[var(--color-primary)] border-[var(--ui-border)]";

  return (
    <Card className={className} {...props}>
      {(title || badge) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? (
            <h3 className="text-base font-semibold text-[var(--ui-foreground)]">
              {title}
            </h3>
          ) : null}
          {badge ? (
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeToneClass}`}
            >
              {badge}
            </span>
          ) : null}
        </div>
      )}
      {children}
    </Card>
  );
}

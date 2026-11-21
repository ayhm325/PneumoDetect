// UnifiedCard: بطاقة موحدة تدعم الزجاجي (glass) أو العادي أو مع شارة (badge)
"use client";
import React from "react";

export default function UnifiedCard({
  title,
  children,
  badge,
  glass = false,
  className = "",
  ...props
}) {
  const base = glass
    ? "relative rounded-xl card-glass p-6"
    : "rounded-xl border border-(--ui-border) bg-(--ui-surface) p-6";
  const classes = [base, className].filter(Boolean).join(" ");
  return (
    <section
      className={classes}
      role={title ? "region" : undefined}
      aria-label={title || undefined}
      {...props}
    >
      {badge && (
        <span className="absolute -top-3 -left-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-md btn-gradient">
          {badge}
        </span>
      )}
      {title && (
        <h3 className="text-xl font-bold text-(--ui-foreground) mb-3">{title}</h3>
      )}
      <div className="text-(--ui-muted-foreground)">{children}</div>
    </section>
  );
}
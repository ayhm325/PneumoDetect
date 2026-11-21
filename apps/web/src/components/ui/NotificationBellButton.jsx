"use client";

import React from "react";
import { FaBell } from "react-icons/fa";

export default function NotificationBellButton({
  count = 0,
  onClick,
  title,
  className = "",
  iconClassName = "",
  ...props
}) {
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
  const classes = [
    "relative p-3 card-glass rounded-full border border-[var(--ui-border)] shadow-(--shadow-soft) hover:shadow-(--shadow-lift) transition-shadow",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={classes}
      {...props}
    >
      <FaBell
        className={`text-xl text-(--ui-muted-foreground) ${iconClassName}`}
      />
      {safeCount > 0 && (
        <span className="absolute -top-1 ltr:-right-1 rtl:-left-1 bg-(--ui-danger) text-(--ui-danger-foreground) text-xs w-5 h-5 flex items-center justify-center rounded-full">
          {safeCount}
        </span>
      )}
    </button>
  );
}

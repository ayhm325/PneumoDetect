import type { ReactNode } from "react";

import type { ActivityItem } from "./types";

interface ActivityListProps {
  title: string;
  items: ActivityItem[];
  headerAction?: ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function ActivityList({
  title,
  items,
  headerAction,
  emptyMessage,
  className,
}: ActivityListProps) {
  return (
    <section className={className ? `pd-activity ${className}` : "pd-activity"}>
      <header className="pd-activity__header">
        <h3>{title}</h3>
        {headerAction}
      </header>

      {items.length === 0 ? (
        emptyMessage ? (
          <p className="py-6 text-sm opacity-75">{emptyMessage}</p>
        ) : null
      ) : (
        <ul className="pd-activity__list">
          {items.map((item) => {
            const dotClass =
              item.tone === "sage"
                ? "pd-tone-sage-dot"
                : `pd-tone-${item.tone ?? "sage-dot"}`;

            return (
              <li key={item.id} className="pd-activity__item">
                <span className={`pd-activity__dot ${dotClass}`} aria-hidden="true" />

                <div className="pd-activity__body">
                  <strong>{item.title}</strong>
                  {item.description && <p>{item.description}</p>}
                </div>

                <div className="pd-activity__meta">
                  <time className="pd-activity__time">{item.timestamp}</time>
                  {item.actionLabel && item.onAction && (
                    <button
                      type="button"
                      onClick={item.onAction}
                      className="pd-btn pd-btn--link text-xs"
                    >
                      {item.actionLabel}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

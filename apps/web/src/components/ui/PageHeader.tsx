import React from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="mb-7 flex flex-col gap-4 border-b border-[var(--pd-line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        {eyebrow && <p className="pd-eyebrow">{eyebrow}</p>}
        <h1 className="text-[length:var(--text-2xl)] font-semibold leading-tight tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)] sm:text-[1.9rem]">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--pd-text-muted)]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}

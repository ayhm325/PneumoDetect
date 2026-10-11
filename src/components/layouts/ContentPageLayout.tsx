import React from "react";
import clsx from "clsx";

type ContentPageLayoutProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function ContentPageLayout({ title, subtitle, actions, children, className }: ContentPageLayoutProps) {
  return (
    <section className={clsx("space-y-6 p-4 sm:p-6 lg:p-8", className)}>
      <header className="ui-future-panel rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="brand-gradient-text text-2xl font-bold sm:text-3xl">{title}</h1>
            {subtitle ? <p className="max-w-3xl text-sm text-[var(--ui-muted)] sm:text-base">{subtitle}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

import React from "react";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function SearchInput({ label, className = "", ...props }: SearchInputProps) {
  return (
    <div className="relative w-full max-w-sm">
      {label && <label className="sr-only">{label}</label>}
      <input
        type="search"
        className={`h-11 w-full rounded-[10px] border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] ps-10 pe-3.5 text-sm text-[var(--ui-foreground)] outline-none transition placeholder:text-[var(--ui-muted-2)] focus:border-[var(--ui-ring)] focus:ring-2 focus:ring-[var(--ui-accent-glow)] ${className}`}
        {...props}
      />
      <svg
        className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-muted)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </div>
  );
}

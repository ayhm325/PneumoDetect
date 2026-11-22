import React from "react";
import { SearchIcon } from "lucide-react";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function SearchInput({ label, className = "", ...props }: SearchInputProps) {
  return (
    <div className="group relative w-full max-w-sm">
      {label && <label className="sr-only">{label}</label>}
      <input
        type="search"
        className={`pd-field h-11 rounded-full ps-10 pe-4 text-sm ${className}`}
        {...props}
      />
      <SearchIcon
        size={16}
        strokeWidth={1.7}
        aria-hidden="true"
        className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--pd-text-muted)] transition-colors group-focus-within:text-[var(--pd-acid)]"
      />
    </div>
  );
}

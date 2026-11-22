import React from "react";
import clsx from "clsx";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  wrapperClassName?: string;
};

export function Input({
  label,
  error,
  startIcon,
  endIcon,
  className,
  id,
  wrapperClassName,
  ...props
}: InputProps) {
  const inputId = id || props.name;
  return (
    <div className={clsx("space-y-1.5", wrapperClassName)}>
      <label
        htmlFor={inputId}
        className="block text-[13px] font-medium text-[var(--ui-foreground)]"
      >
        {label}
      </label>
      <div
        className={clsx(
          "relative flex items-center rounded-[10px] border bg-[var(--ui-surface-elevated)] transition-colors",
          error
            ? "border-[var(--ui-danger)] ring-2 ring-[var(--ui-danger-bg)]"
            : "border-[var(--ui-border)] focus-within:border-[var(--ui-ring)] focus-within:ring-2 focus-within:ring-[var(--ui-accent-glow)]",
        )}
      >
        {startIcon ? (
          <span className="pointer-events-none absolute start-3.5 text-[var(--ui-muted)]">
            {startIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          className={clsx(
            "h-11 w-full rounded-[10px] bg-transparent text-sm text-[var(--ui-foreground)] outline-none placeholder:text-[var(--ui-muted-2)] disabled:cursor-not-allowed disabled:opacity-60",
            startIcon ? "ps-10" : "ps-3.5",
            endIcon ? "pe-10" : "pe-3.5",
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {endIcon ? (
          <span className="absolute end-3.5 text-[var(--ui-muted)]">
            {endIcon}
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-[var(--ui-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default Input;

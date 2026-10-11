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
    <div className={clsx("space-y-2", wrapperClassName)}>
      <label htmlFor={inputId} className="block text-sm font-medium text-[var(--ui-foreground)]">
        {label}
      </label>

      <div
        className={clsx(
          "ui-future-panel relative flex items-center rounded-xl border transition-colors",
          error
            ? "border-[var(--ui-danger)]"
            : "border-[var(--ui-border)] focus-within:border-[var(--ui-border-strong)]",
        )}
      >
        {startIcon ? (
          <span className="pointer-events-none absolute left-3 text-[var(--ui-muted)]">{startIcon}</span>
        ) : null}

        <input
          id={inputId}
          className={clsx(
            "h-11 w-full rounded-xl bg-transparent px-3 text-sm text-[var(--ui-foreground)] outline-none placeholder:text-[var(--ui-muted)]",
            startIcon ? "pl-10" : "pl-3",
            endIcon ? "pr-10" : "pr-3",
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />

        {endIcon ? <span className="absolute right-3 text-[var(--ui-muted)]">{endIcon}</span> : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--ui-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

import { CircleXIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import React, { useState } from "react";
import clsx from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  wrapperClassName?: string;
}

const fieldShellClass = (error?: string, disabled?: boolean) =>
  clsx(
    "group relative flex items-center rounded-[var(--shape-control)] border bg-[var(--pd-canvas-raised)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)] transition-all duration-200",
    error
      ? "border-[color-mix(in_srgb,var(--pd-coral)_65%,transparent)] ring-3 ring-[var(--pd-coral-soft)]"
      : "border-[var(--pd-line)] hover:border-[var(--pd-line-strong)] focus-within:border-[color-mix(in_srgb,var(--pd-acid)_65%,transparent)] focus-within:bg-[var(--pd-surface-deep)] focus-within:ring-3 focus-within:ring-[var(--pd-acid-soft)]",
    disabled && "cursor-not-allowed opacity-55",
  );

export function Input({
  label,
  error,
  helperText,
  startIcon,
  endIcon,
  clearable,
  onClear,
  className,
  id,
  wrapperClassName,
  required,
  disabled,
  value,
  ...props
}: InputProps) {
  const inputId = id || props.name;

  return (
    <div className={clsx("space-y-1.5", wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="pd-label !mb-0 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-[var(--pd-coral)]">*</span>}
        </label>
      )}
      <div className={fieldShellClass(error, disabled)}>
        {startIcon && (
          <span className="pointer-events-none absolute start-3.5 shrink-0 text-[var(--pd-text-muted)] transition-colors group-focus-within:text-[var(--pd-acid)]">
            {startIcon}
          </span>
        )}
        <input
          id={inputId}
          disabled={disabled}
          value={value}
          className={clsx(
            "h-11 w-full rounded-[var(--shape-control)] bg-transparent text-[length:var(--text-md)] text-[var(--pd-text-primary)] outline-none placeholder:text-[var(--pd-text-muted)] disabled:cursor-not-allowed",
            startIcon ? "ps-10" : "ps-3.5",
            endIcon || clearable ? "pe-10" : "pe-3.5",
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
          required={required}
          {...props}
        />
        {clearable && value && !disabled ? (
          <button
            type="button"
            onClick={onClear}
            tabIndex={-1}
            aria-label="Clear input"
            className="absolute end-3 text-[var(--pd-text-muted)] transition-colors hover:text-[var(--pd-text-primary)]"
          >
            <CircleXIcon className="h-4 w-4" />
          </button>
        ) : endIcon ? (
          <span className="absolute end-3.5 shrink-0 text-[var(--pd-text-muted)]">
            {endIcon}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-[var(--pd-coral)]">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="text-xs text-[var(--pd-text-muted)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export interface PasswordInputProps extends Omit<InputProps, "type"> {}

export function PasswordInput({
  label,
  error,
  helperText,
  className,
  id,
  wrapperClassName,
  required,
  disabled,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || props.name;

  return (
    <div className={clsx("space-y-1.5", wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="pd-label !mb-0 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-[var(--pd-coral)]">*</span>}
        </label>
      )}
      <div className={fieldShellClass(error, disabled)}>
        <input
          id={inputId}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          className={clsx(
            "h-11 w-full rounded-[var(--shape-control)] bg-transparent ps-3.5 pe-10 text-[length:var(--text-md)] text-[var(--pd-text-primary)] outline-none placeholder:text-[var(--pd-text-muted)] disabled:cursor-not-allowed",
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
          required={required}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute end-3.5 rounded-full p-1 text-[var(--pd-text-muted)] transition-colors hover:text-[var(--pd-acid)]"
        >
          {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-[var(--pd-coral)]">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="text-xs text-[var(--pd-text-muted)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  className,
  id,
  wrapperClassName,
  required,
  disabled,
  rows = 3,
  ...props
}: TextareaProps) {
  const inputId = id || props.name;

  return (
    <div className={clsx("space-y-1.5", wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="pd-label !mb-0 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-[var(--pd-coral)]">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        disabled={disabled}
        className={clsx(
          "pd-field p-3 text-[length:var(--text-md)]",
          error && "!border-[color-mix(in_srgb,var(--pd-coral)_65%,transparent)]",
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
        required={required}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-[var(--pd-coral)]">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="text-xs text-[var(--pd-text-muted)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export default Input;

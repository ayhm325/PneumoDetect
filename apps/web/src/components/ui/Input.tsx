import React, { useState } from "react";
import clsx from "clsx";
import { FaEye, FaEyeSlash, FaTimesCircle } from "react-icons/fa";

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
        <label
          htmlFor={inputId}
          className="flex items-center gap-1 text-[13px] font-semibold text-[var(--ui-foreground)]"
        >
          <span>{label}</span>
          {required && <span className="text-[var(--ui-danger)]">*</span>}
        </label>
      )}
      <div
        className={clsx(
          "relative flex items-center rounded-xl border bg-[var(--ui-surface-elevated)] transition-all duration-200",
          error
            ? "border-[var(--ui-danger)] ring-2 ring-[var(--ui-danger-bg)]"
            : "border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] focus-within:border-[var(--ui-ring)] focus-within:ring-3 focus-within:ring-[var(--ui-accent-glow)]",
          disabled && "opacity-60 cursor-not-allowed bg-[var(--ui-surface-2)]",
        )}
      >
        {startIcon && (
          <span className="pointer-events-none absolute start-3.5 text-[var(--ui-muted)] shrink-0">
            {startIcon}
          </span>
        )}
        <input
          id={inputId}
          disabled={disabled}
          value={value}
          className={clsx(
            "h-11 w-full rounded-xl bg-transparent text-sm text-[var(--ui-foreground)] outline-none placeholder:text-[var(--ui-muted-2)] disabled:cursor-not-allowed",
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
            className="absolute end-3 text-[var(--ui-muted)] hover:text-[var(--ui-foreground)] transition"
          >
            <FaTimesCircle className="h-4 w-4" />
          </button>
        ) : endIcon ? (
          <span className="absolute end-3.5 text-[var(--ui-muted)] shrink-0">
            {endIcon}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-[var(--ui-danger)]">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="text-xs text-[var(--ui-muted-foreground)]">
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
        <label
          htmlFor={inputId}
          className="flex items-center gap-1 text-[13px] font-semibold text-[var(--ui-foreground)]"
        >
          <span>{label}</span>
          {required && <span className="text-[var(--ui-danger)]">*</span>}
        </label>
      )}
      <div
        className={clsx(
          "relative flex items-center rounded-xl border bg-[var(--ui-surface-elevated)] transition-all duration-200",
          error
            ? "border-[var(--ui-danger)] ring-2 ring-[var(--ui-danger-bg)]"
            : "border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] focus-within:border-[var(--ui-ring)] focus-within:ring-3 focus-within:ring-[var(--ui-accent-glow)]",
          disabled && "opacity-60 cursor-not-allowed bg-[var(--ui-surface-2)]",
        )}
      >
        <input
          id={inputId}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          className={clsx(
            "h-11 w-full rounded-xl bg-transparent ps-3.5 pe-10 text-sm text-[var(--ui-foreground)] outline-none placeholder:text-[var(--ui-muted-2)] disabled:cursor-not-allowed",
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
          className="absolute end-3.5 text-[var(--ui-muted)] hover:text-[var(--ui-foreground)] transition focus-visible:outline-2 focus-visible:outline-sky-400 rounded-sm"
        >
          {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-[var(--ui-danger)]">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="text-xs text-[var(--ui-muted-foreground)]">
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
        <label
          htmlFor={inputId}
          className="flex items-center gap-1 text-[13px] font-semibold text-[var(--ui-foreground)]"
        >
          <span>{label}</span>
          {required && <span className="text-[var(--ui-danger)]">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        disabled={disabled}
        className={clsx(
          "w-full rounded-xl border bg-[var(--ui-surface-elevated)] p-3 text-sm text-[var(--ui-foreground)] outline-none placeholder:text-[var(--ui-muted-2)] transition-all duration-200 disabled:cursor-not-allowed",
          error
            ? "border-[var(--ui-danger)] ring-2 ring-[var(--ui-danger-bg)]"
            : "border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] focus:border-[var(--ui-ring)] focus:ring-3 focus:ring-[var(--ui-accent-glow)]",
          disabled && "opacity-60 bg-[var(--ui-surface-2)]",
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
        required={required}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-[var(--ui-danger)]">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="text-xs text-[var(--ui-muted-foreground)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export default Input;

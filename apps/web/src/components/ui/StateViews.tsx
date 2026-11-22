import React from "react";
import { useTranslation } from "react-i18next";
import { FaExclamationTriangle, FaFolderOpen, FaRedoAlt } from "react-icons/fa";
import { Button } from "./Button";

export interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
  className?: string;
}

export function LoadingState({ message, fullPage = false, className = "" }: LoadingStateProps) {
  const { t } = useTranslation("common");

  const containerClass = fullPage
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--ui-surface)]/85 backdrop-blur-md"
    : `flex min-h-[260px] flex-col items-center justify-center gap-4 p-8 text-center ${className}`;

  return (
    <div className={containerClass} role="status" aria-live="polite">
      <div className="relative flex items-center justify-center">
        {/* Pulsing outer aura */}
        <div className="absolute h-14 w-14 animate-ping rounded-full bg-[var(--color-primary-500)]/15" />
        {/* Sleek dual-ring spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[var(--ui-border)] border-t-[var(--color-primary-500)] border-r-[var(--color-secondary-500)]" />
      </div>
      <p className="text-sm font-semibold text-[var(--ui-foreground)] tracking-wide">
        {message || t("loading", "Loading...")}
      </p>
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  className = "",
}: ErrorStateProps) {
  const { t } = useTranslation("common");

  return (
    <div
      role="alert"
      className={`mx-auto my-6 max-w-lg rounded-2xl border border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] p-6 text-center shadow-xs transition-all ${className}`}
    >
      <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ui-danger)]/15 text-[var(--ui-danger)]">
        <FaExclamationTriangle className="h-5 w-5" />
      </div>
      <h4 className="text-base font-bold text-[var(--ui-danger-foreground)]">
        {title || t("error", "Error")}
      </h4>
      <p className="mt-1 text-sm text-[var(--ui-danger-foreground)]/90 leading-relaxed">
        {message || t("errorDesc", "An unexpected error occurred. Please try again.")}
      </p>
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button
            variant="danger"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <FaRedoAlt className="h-3 w-3" />
            <span>{t("retry", "Retry")}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-2)]/30 p-10 text-center transition-all ${className}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-muted)] shadow-xs">
        {icon || <FaFolderOpen className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-bold text-[var(--ui-foreground)]">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-[var(--ui-muted-foreground)] leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

export function PageLoading() {
  return <LoadingState fullPage />;
}

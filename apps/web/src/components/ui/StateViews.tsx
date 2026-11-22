import { FolderOpenIcon, RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";

export interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
  className?: string;
}

export function LoadingState({ message, fullPage = false, className = "" }: LoadingStateProps) {
  const { t } = useTranslation("common");

  const containerClass = fullPage
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--pd-canvas)]/90 backdrop-blur-sm"
    : `flex min-h-[240px] flex-col items-center justify-center gap-4 p-8 text-center ${className}`;

  return (
    <div className={containerClass} role="status" aria-live="polite">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-[var(--pd-line-strong)]"
        />
        <span
          aria-hidden="true"
          className="h-12 w-12 rounded-full border-2 border-transparent border-t-[var(--pd-acid)] border-e-[var(--pd-orchid)]"
          style={{ animation: "pd-spin 1s linear infinite" }}
        />
        <span
          aria-hidden="true"
          className="pd-breathe absolute h-2 w-2 rounded-full bg-[var(--pd-acid)]"
        />
      </div>
      <p className="text-sm font-medium text-[var(--pd-text-secondary)]">
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

export function ErrorState({ title, message, onRetry, className = "" }: ErrorStateProps) {
  const { t } = useTranslation("common");

  return (
    <div
      role="alert"
      className={`pd-panel pd-panel--leaf mx-auto my-6 max-w-lg border-[color-mix(in_srgb,var(--pd-coral)_32%,transparent)] bg-[var(--pd-coral-soft)] p-6 text-center ${className}`}
    >
      <div className="pd-orb pd-orb--coral mx-auto mb-3.5">
        <TriangleAlertIcon size={20} strokeWidth={1.7} />
      </div>
      <h4 className="text-base font-semibold text-[var(--pd-text-primary)]">
        {title || t("error", "Error")}
      </h4>
      <p className="mt-1 text-sm leading-relaxed text-[var(--pd-text-secondary)]">
        {message || t("errorDesc", "An unexpected error occurred. Please try again.")}
      </p>
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button variant="danger" size="sm" onClick={onRetry}>
            <RotateCwIcon size={14} strokeWidth={1.7} />
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

export function EmptyState({ title, description, icon, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`pd-panel pd-panel--organic flex flex-col items-center justify-center border-dashed border-[var(--pd-line-strong)] bg-[var(--pd-canvas-raised)] p-10 text-center ${className}`}
    >
      <div className="pd-orb pd-orb--lg mb-4 text-[var(--pd-text-muted)]">
        {icon || <FolderOpenIcon size={22} strokeWidth={1.7} />}
      </div>
      <h3 className="text-base font-semibold text-[var(--pd-text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[var(--pd-text-muted)]">
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

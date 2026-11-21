import React from "react";
import { useTranslation } from "react-i18next";

export function LoadingState({ message }: { message?: string }) {
  const { t } = useTranslation("common");
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {message || t("loading", "Loading...")}
      </p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="mx-auto my-6 max-w-md rounded-2xl border border-red-200 bg-red-50/80 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
      <p className="text-sm font-semibold text-red-700 dark:text-red-300">
        {message || t("error", "Something went wrong")}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          {t("retry", "Retry")}
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}

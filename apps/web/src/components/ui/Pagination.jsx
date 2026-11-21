"use client";

import { useLocale, useTranslations } from "@/lib/compat/intl";

export default function Pagination({
  page = 1,
  pageCount = 1,
  onPageChange = () => {},
  className,
  ...props
}) {
  useLocale(); // Ensure component updates when locale changes
  const t = useTranslations("ui");

  const prevLabel = t("pagination.previous");
  const nextLabel = t("pagination.next");
  const pageLabel = t("pagination.page");
  const ofLabel = t("pagination.of");

  const prevDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  const btnClass =
    "h-9 px-3 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-foreground)] hover:bg-[var(--ui-surface-2)] disabled:opacity-50";

  const containerClass = [
    "mt-4 flex items-center justify-center gap-2",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass} {...props}>
      <button
        disabled={prevDisabled}
        className={btnClass}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        {prevLabel}
      </button>
      <span className="mx-2 text-sm text-(--ui-muted-foreground)">
        {pageLabel} {page} {ofLabel} {pageCount}
      </span>
      <button
        disabled={nextDisabled}
        className={btnClass}
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
      >
        {nextLabel}
      </button>
    </div>
  );
}
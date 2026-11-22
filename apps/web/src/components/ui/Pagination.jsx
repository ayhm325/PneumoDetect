"use client";

import { useLocale, useTranslations } from "@/lib/compat/intl";
import Button from "./Button";

export default function Pagination({
  page = 1,
  pageCount = 1,
  onPageChange = () => {},
  className = "",
  ...props
}) {
  useLocale();
  const t = useTranslations("ui");

  const prevLabel = t("pagination.previous");
  const nextLabel = t("pagination.next");
  const pageLabel = t("pagination.page");
  const ofLabel = t("pagination.of");

  const prevDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  return (
    <div
      className={`mt-4 flex items-center justify-center gap-2 ${className}`.trim()}
      {...props}
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={prevDisabled}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        {prevLabel}
      </Button>
      <span className="mx-2 text-xs font-medium text-[var(--ui-muted)]">
        {pageLabel} {page} {ofLabel} {pageCount}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={nextDisabled}
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
      >
        {nextLabel}
      </Button>
    </div>
  );
}

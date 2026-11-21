"use client";

import React from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function Pagination({ current, total, onPageChange }) {
  const t = useTranslations("doctorCommon");
  const prevLabel = t("pagination.previous");
  const nextLabel = t("pagination.next");
  const ofLabel = "/";
  return (
    <div className="my-4 flex items-center justify-center gap-2">
      <button
        disabled={current === 1}
        onClick={() => onPageChange(current - 1)}
        className="rounded-xl border border-(--ui-border) bg-(--ui-surface-2) px-3 py-2 text-sm font-semibold text-foreground hover:opacity-90 disabled:opacity-50"
      >
        {prevLabel}
      </button>
      <span className="text-sm text-(--ui-muted-2)">
        {current} {ofLabel} {total}
      </span>
      <button
        disabled={current === total}
        onClick={() => onPageChange(current + 1)}
        className="rounded-xl border border-(--ui-border) bg-(--ui-surface-2) px-3 py-2 text-sm font-semibold text-foreground hover:opacity-90 disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  );
}
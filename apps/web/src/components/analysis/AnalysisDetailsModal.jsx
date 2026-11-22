"use client";
import { ScanLineIcon, XIcon } from "lucide-react";
import React from "react";
import Image from "@/lib/compat/Image";
import AnalysisResultCard from "./AnalysisResultCard";
import { IconButton } from "@/components/ui";
import { useTranslations } from "@/lib/compat/intl";

export default function AnalysisDetailsModal({
  record,
  onClose,
  saved = false,
  saveError = null,
}) {
  const t = useTranslations("patient");
  if (!record) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--pd-scrim)] p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("analysisDetails.title")}
    >
      <div
        className="pd-panel pd-panel--feature max-h-[90vh] w-full max-w-4xl overflow-y-auto p-5 shadow-[var(--pd-shadow-float)] md:p-7"
        dir="auto"
      >
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-[var(--pd-line)] pb-4">
          <div className="flex items-center gap-3">
            <div className="pd-orb pd-orb--sm pd-orb--orchid">
              <ScanLineIcon size={17} strokeWidth={1.7} />
            </div>
            <h2 className="text-lg font-semibold tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)]">
              {t("analysisDetails.title")}
            </h2>
          </div>
          <IconButton
            onClick={onClose}
            aria-label={t("analysisDetails.closeDetails")}
            variant="ghost"
            size="sm"
          >
            <XIcon size={16} strokeWidth={1.7} />
          </IconButton>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--pd-text-muted)]">
              {t("analysisDetails.originalImage")}
            </div>
            {record.imageUrl || record.image_url ? (
              <a
                href={record.imageUrl ?? record.image_url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={t("analysisDetails.openOriginalImage")}
                className="block overflow-hidden rounded-[var(--shape-control)] border border-[var(--pd-line)] bg-[var(--pd-stage)] p-2"
              >
                <Image
                  src={record.imageUrl ?? record.image_url}
                  alt={t("analysisDetails.originalImage")}
                  width={400}
                  height={260}
                  className="h-auto max-h-64 w-full object-contain"
                  unoptimized
                />
              </a>
            ) : (
              <div className="flex h-44 items-center justify-center rounded-[var(--shape-control)] border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] text-[var(--pd-text-muted)]">
                <ScanLineIcon size={28} strokeWidth={1.5} className="opacity-40" />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <AnalysisResultCard result={record} saved={saved} saveError={saveError} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}

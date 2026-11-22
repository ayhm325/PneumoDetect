"use client";
import React from "react";
import { FaTimes, FaXRay } from "react-icons/fa";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={t("analysisDetails.title")}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[22px] border border-(--ui-border) bg-(--ui-surface-elevated) p-5 md:p-7 text-(--ui-foreground) shadow-(--shadow-lift)"
        dir="auto"
      >
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-(--ui-border) pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--ui-info-border) bg-(--ui-info-bg) text-(--ui-info)">
              <FaXRay className="text-lg" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-(--ui-foreground)">
              {t("analysisDetails.title")}
            </h2>
          </div>
          <IconButton
            onClick={onClose}
            aria-label={t("analysisDetails.closeDetails")}
            variant="ghost"
            size="sm"
          >
            <FaTimes />
          </IconButton>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--ui-muted-foreground)">
              {t("analysisDetails.originalImage")}
            </div>
            {record.imageUrl || record.image_url ? (
              <a
                href={record.imageUrl ?? record.image_url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={t("analysisDetails.openOriginalImage")}
                className="block overflow-hidden rounded-2xl border border-(--ui-border) bg-(--ui-surface-2) shadow-(--shadow-card-media)"
              >
                <Image
                  src={record.imageUrl ?? record.image_url}
                  alt={t("analysisDetails.originalImage")}
                  width={400}
                  height={260}
                  className="h-auto w-full object-cover"
                  unoptimized
                />
              </a>
            ) : (
              <div className="flex h-44 items-center justify-center rounded-2xl border border-(--ui-border) bg-(--ui-surface-2) text-(--ui-muted-foreground)">
                <FaXRay className="text-3xl opacity-40" />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <AnalysisResultCard
              result={record}
              saved={saved}
              saveError={saveError}
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

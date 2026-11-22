"use client";

import React from "react";
import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaMicrochip,
  FaXRay,
} from "react-icons/fa";
import { useTranslations } from "@/lib/compat/intl";
import { MedicalImageViewer } from "./MedicalImageViewer";

function ConfidenceBar({ value, t }) {
  const pct = Math.round((Number(value) || 0) * 100);

  let barColor = "bg-[var(--ui-warning)]";
  if (pct >= 75) barColor = "bg-[var(--ui-success)]";
  else if (pct < 50) barColor = "bg-[var(--ui-danger)]";

  return (
    <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] p-3.5">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-[var(--ui-muted-foreground)]">
          {t("analysisDetails.confidenceScore")}
        </span>
        <span className="text-sm font-extrabold text-[var(--ui-foreground)]">
          {pct}%
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--ui-surface)]">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-300`}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

export default function AnalysisResultCard({
  result,
  t: tProp,
}) {
  const tHook = useTranslations("patient");
  const t = tProp || tHook;
  if (!result) return null;

  const confidence =
    typeof result.confidence === "number" ? result.confidence : 0;
  const prediction = result.prediction || "—";
  const model = result.model_version || result.modelVersion || "unknown";
  const timeMs = result.inference_time_ms ?? result.inferenceTimeMs ?? 0;

  const isNormal = String(prediction).toLowerCase().includes("normal");

  return (
    <div
      className="max-w-full rounded-[22px] border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-5 text-[var(--ui-foreground)] shadow-[var(--shadow-card)]"
      dir="auto"
      role="group"
      aria-label={t("analysisDetails.analysisResult")}
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg ${
              isNormal
                ? "border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-success)]"
                : "border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] text-[var(--ui-warning)]"
            }`}
          >
            {isNormal ? <FaCheckCircle /> : <FaExclamationTriangle />}
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ui-muted-foreground)]">
              {t("analysisDetails.analysis")}
            </div>
            <div className="text-lg font-extrabold tracking-tight text-[var(--ui-foreground)]">
              {prediction}
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3 py-1 text-xs font-medium text-[var(--ui-muted-foreground)]">
          <FaMicrochip className="text-[var(--ui-info)]" />
          <span>
            {t("analysisDetails.model")}: {model}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)]/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--ui-muted-foreground)]">
              {t("analysisDetails.diagnosis")}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                isNormal
                  ? "border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-success)]"
                  : "border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] text-[var(--ui-warning)]"
              }`}
            >
              {prediction}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-[var(--ui-muted-foreground)]">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("analysisDetails.model")}:</span>
              <code className="rounded bg-[var(--ui-surface)] px-1.5 py-0.5 text-[11px] text-[var(--ui-foreground)]">
                {model}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 font-medium">
                <FaClock className="text-[var(--ui-info)]" />
                {t("analysisDetails.inferenceTime")}:
              </span>
              <span className="font-semibold text-[var(--ui-foreground)]">
                {timeMs} ms
              </span>
            </div>
          </div>
        </div>

        <div>
          <ConfidenceBar value={confidence} t={t} />
        </div>
      </div>

      {/* Advanced Clinical Medical Viewer */}
      {((result.imageUrl || result.image_url) || (result.heatmap_url || result.heatmapUrl)) && (
        <div className="mt-5">
          <MedicalImageViewer
            originalImageUrl={result.imageUrl ?? result.image_url}
            heatmapUrl={result.heatmap_url ?? result.heatmapUrl}
            prediction={prediction}
            confidence={confidence}
            modelVersion={model}
            inferenceTimeMs={timeMs}
          />
        </div>
      )}
    </div>
  );
}

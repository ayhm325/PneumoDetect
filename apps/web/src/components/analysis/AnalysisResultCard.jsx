"use client";

import { CircleCheckIcon, ClockIcon, CpuIcon, TriangleAlertIcon } from "lucide-react";
import React from "react";
import { useTranslations } from "@/lib/compat/intl";
import { MedicalImageViewer } from "./MedicalImageViewer";

function ConfidenceBar({ value, t }) {
  const pct = Math.round((Number(value) || 0) * 100);

  let barColor = "bg-[var(--pd-marigold)]";
  if (pct >= 75) barColor = "bg-[var(--pd-success)]";
  else if (pct < 50) barColor = "bg-[var(--pd-coral)]";

  return (
    <div className="pd-panel pd-panel--deep p-4">
      <div className="mb-2.5 flex items-center justify-between text-xs">
        <span className="font-medium text-[var(--pd-text-muted)]">
          {t("analysisDetails.confidenceScore")}
        </span>
        <span className="pd-tabular text-sm font-semibold text-[var(--pd-text-primary)]">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--pd-surface)]">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-300`}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

export default function AnalysisResultCard({ result, t: tProp }) {
  const tHook = useTranslations("patient");
  const t = tProp || tHook;
  if (!result) return null;

  const confidence = typeof result.confidence === "number" ? result.confidence : 0;
  const prediction = result.prediction || "—";
  const model = result.model_version || result.modelVersion || "unknown";
  const timeMs = result.inference_time_ms ?? result.inferenceTimeMs ?? 0;
  const isNormal = String(prediction).toLowerCase().includes("normal");

  return (
    <div
      className="pd-panel pd-panel--feature-alt max-w-full p-5 text-[var(--pd-text-primary)]"
      dir="auto"
      role="group"
      aria-label={t("analysisDetails.analysisResult")}
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pd-line)] pb-4">
        <div className="flex items-center gap-3">
          <div className={`pd-orb ${isNormal ? "pd-orb--moss" : "pd-orb--marigold"}`}>
            {isNormal ? (
              <CircleCheckIcon size={20} strokeWidth={1.7} />
            ) : (
              <TriangleAlertIcon size={20} strokeWidth={1.7} />
            )}
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--pd-text-muted)]">
              {t("analysisDetails.analysis")}
            </div>
            <div className="text-lg font-semibold tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)]">
              {prediction}
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--pd-orchid)_28%,transparent)] bg-[var(--pd-orchid-soft)] px-3 py-1 text-xs font-medium text-[var(--pd-orchid)]">
          <CpuIcon size={13} strokeWidth={1.7} />
          <span>
            {t("analysisDetails.model")}: {model}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="pd-panel pd-panel--deep space-y-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--pd-text-muted)]">
              {t("analysisDetails.diagnosis")}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                isNormal
                  ? "border-[color-mix(in_srgb,var(--pd-success)_32%,transparent)] bg-[var(--pd-moss-soft)] text-[var(--pd-success)]"
                  : "border-[color-mix(in_srgb,var(--pd-marigold)_34%,transparent)] bg-[var(--pd-marigold-soft)] text-[var(--pd-marigold)]"
              }`}
            >
              {prediction}
            </span>
          </div>

          <div className="pd-tabular space-y-1.5 text-xs text-[var(--pd-text-muted)]">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("analysisDetails.model")}:</span>
              <code className="rounded bg-[var(--pd-surface)] px-1.5 py-0.5 text-[11px] text-[var(--pd-text-primary)]">
                {model}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 font-medium">
                <ClockIcon size={13} strokeWidth={1.7} className="text-[var(--pd-orchid)]" />
                {t("analysisDetails.inferenceTime")}:
              </span>
              <span className="font-semibold text-[var(--pd-text-primary)]">{timeMs} ms</span>
            </div>
          </div>
        </div>

        <div>
          <ConfidenceBar value={confidence} t={t} />
        </div>
      </div>

      {/* Clinical Medical Viewer */}
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

"use client";

import React from "react";
import Image from "@/lib/compat/Image";
import { useTranslations } from "@/lib/compat/intl";

function ConfidenceBar({ value, t }) {
  const pct = Math.round((Number(value) || 0) * 100);

  let color = "from-red-500 to-yellow-400";
  if (pct >= 75) color = "from-green-400 to-green-600";
  else if (pct >= 50) color = "from-yellow-300 to-yellow-500";

  return (
    <div>
      <div className="w-full bg-gray-100 rounded h-3 overflow-hidden">
        <div
          className={`h-3 bg-linear-to-r ${color} transition-all duration-300`}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <div className="font-medium">{pct}%</div>
        <div className="text-xs text-gray-500">
          {t("analysisDetails.confidenceScore")}
        </div>
      </div>
    </div>
  );
}

export default function AnalysisResultCard({
  result,
  saved = false,
  saveError = null,
  t: tProp,
}) {
  const tHook = useTranslations("patient");
  const t = tProp || tHook;
  if (!result) return null;

  const confidence =
    typeof result.confidence === "number" ? result.confidence : 0;
  const prediction = result.prediction || "—";
  const model = result.model_version || result.modelVersion || "unknown";
  const timeMs =
    result.inference_time_ms ?? result.inferenceTimeMs ?? 0;

  const isNormal = String(prediction).toLowerCase().includes("normal");

  return (
    <div
      className="p-4 bg-white border rounded-lg shadow-sm max-w-full hover:shadow-lg transition-transform hover:-translate-y-0.5"
      dir="auto"
      role="group"
      aria-label={t("analysisDetails.analysisResult")}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-pink-500 text-white rounded-full flex items-center justify-center shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path d="M2 5a2 2 0 012-2h8a2 2 0 012 2v2h2a1 1 0 010 2h-2v2h2a1 1 0 010 2h-2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
            </svg>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              {t("analysisDetails.analysis")}
            </div>
            <div className="text-base font-semibold">{prediction}</div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-linear-to-r from-gray-100 to-white text-xs shadow-sm">
          <span className="text-xs text-gray-700">
            {t("analysisDetails.model")} {model}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col sm:flex-row sm:gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">
              {t("analysisDetails.diagnosis")}
            </h3>
            <span
              className={`text-sm font-medium ${
                isNormal ? "text-green-600" : "text-amber-700"
              }`}
            >
              {prediction}
            </span>
          </div>

          <div className="mt-3 text-sm text-gray-700 space-y-1">
            <div>
              <strong>{t("analysisDetails.model")}:</strong>{" "}
              <code className="text-xs">{model}</code>
            </div>
            <div>
              <strong>{t("analysisDetails.inferenceTime")}:</strong>{" "}
              {timeMs} ms
            </div>
          </div>

          {/* Explanation and saved status removed as requested */}
        </div>

        {/* Confidence */}
        <div className="w-full sm:w-48 mt-4 sm:mt-0">
          <div className="mb-2 text-sm text-gray-600">
            {t("analysisDetails.confidence")}
          </div>
          <ConfidenceBar value={confidence} t={t} />
        </div>
      </div>

      {/* Images */}
      {(result.imageUrl || result.image_url) && (
        <div className="mt-4">
          <div className="text-sm text-gray-500 mb-2">
            {t("analysisDetails.originalImage")}
          </div>
          <a
            href={result.imageUrl ?? result.image_url}
            target="_blank"
            rel="noreferrer noopener"
          >
            <Image
              src={result.imageUrl ?? result.image_url}
              alt={t("analysisDetails.originalImage")}
              width={800}
              height={400}
              className="rounded-lg"
              style={{ maxWidth: "100%", height: "auto" }}
              unoptimized
            />
          </a>
        </div>
      )}

      {(result.heatmap_url || result.heatmapUrl) && (
        <div className="mt-4">
          <div className="text-sm text-gray-500 mb-2">
            {t("analysisDetails.heatmap")}
          </div>
          <Image
            src={result.heatmap_url ?? result.heatmapUrl}
            alt={t("analysisDetails.heatmap")}
            width={800}
            height={400}
            className="rounded-lg"
            style={{ maxWidth: "100%", height: "auto" }}
            unoptimized
          />
        </div>
      )}
    </div>
  );
}

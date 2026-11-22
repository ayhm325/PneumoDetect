import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaAdjust,
  FaCheckCircle,
  FaClock,
  FaColumns,
  FaCompress,
  FaExclamationTriangle,
  FaExpand,
  FaLayerGroup,
  FaMicrochip,
  FaSearchMinus,
  FaSearchPlus,
  FaUndo,
  FaXRay,
} from "react-icons/fa";

export interface MedicalImageViewerProps {
  originalImageUrl?: string | null;
  heatmapUrl?: string | null;
  prediction?: string;
  confidence?: number;
  modelVersion?: string;
  inferenceTimeMs?: number;
  className?: string;
}

export function MedicalImageViewer({
  originalImageUrl,
  heatmapUrl,
  prediction,
  confidence,
  modelVersion = "DenseNet121",
  inferenceTimeMs,
  className = "",
}: MedicalImageViewerProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [viewMode, setViewMode] = useState<"overlay" | "sideBySide" | "original" | "heatmap">(
    heatmapUrl && originalImageUrl ? "overlay" : originalImageUrl ? "original" : "heatmap",
  );
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(65);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [invertColors, setInvertColors] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const isNormal = Boolean(
    prediction && String(prediction).toLowerCase().includes("normal"),
  );

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setInvertColors(false);
  };

  const hasBoth = Boolean(originalImageUrl && heatmapUrl);

  const imageFilterStyle = invertColors ? "invert(1) hue-rotate(180deg)" : "none";

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-card)] transition-all ${
        isFullscreen
          ? "fixed inset-0 z-[var(--z-modal,210)] rounded-none flex flex-col p-4 sm:p-6 bg-slate-950 text-white"
          : className
      }`}
    >
      {/* Viewer Clinical Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] bg-[var(--ui-surface-2)]/60 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm ${
              isNormal
                ? "border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-success)]"
                : "border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] text-[var(--ui-warning)]"
            }`}
          >
            {isNormal ? <FaCheckCircle /> : <FaExclamationTriangle />}
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ui-muted-foreground)]">
              {isAr ? "نتيجة الفحص السريري" : "Screening Assessment"}
            </div>
            <div className="text-base font-extrabold text-[var(--ui-foreground)]">
              {prediction || (isAr ? "تحليل الأشعة" : "Chest X-Ray Analysis")}
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        {hasBoth && (
          <div className="flex items-center rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("overlay")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
                viewMode === "overlay"
                  ? "bg-[var(--color-primary-500)] text-white shadow-xs"
                  : "text-[var(--ui-muted)] hover:text-[var(--ui-foreground)]"
              }`}
            >
              <FaLayerGroup className="h-3 w-3" />
              <span>{isAr ? "تطابق الطبقات" : "Layer Overlay"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("sideBySide")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
                viewMode === "sideBySide"
                  ? "bg-[var(--color-primary-500)] text-white shadow-xs"
                  : "text-[var(--ui-muted)] hover:text-[var(--ui-foreground)]"
              }`}
            >
              <FaColumns className="h-3 w-3" />
              <span>{isAr ? "جنباً إلى جنب" : "Side-by-Side"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("original")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
                viewMode === "original"
                  ? "bg-[var(--color-primary-500)] text-white shadow-xs"
                  : "text-[var(--ui-muted)] hover:text-[var(--ui-foreground)]"
              }`}
            >
              <span>{isAr ? "الأصلية" : "Original"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("heatmap")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
                viewMode === "heatmap"
                  ? "bg-[var(--color-primary-500)] text-white shadow-xs"
                  : "text-[var(--ui-muted)] hover:text-[var(--ui-foreground)]"
              }`}
            >
              <span>{isAr ? "الخريطة" : "Heatmap"}</span>
            </button>
          </div>
        )}

        {/* Telemetry metadata */}
        <div className="flex items-center gap-3 text-xs text-[var(--ui-muted-foreground)]">
          <span className="inline-flex items-center gap-1">
            <FaMicrochip className="text-sky-500" />
            <code>{modelVersion}</code>
          </span>
          {typeof inferenceTimeMs === "number" && inferenceTimeMs > 0 && (
            <span className="inline-flex items-center gap-1">
              <FaClock className="text-teal-500" />
              <span>{inferenceTimeMs}ms</span>
            </span>
          )}
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] px-4 py-2.5 bg-[var(--ui-surface)] text-xs">
        {/* Opacity Slider for Overlay Mode */}
        {hasBoth && viewMode === "overlay" ? (
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-[var(--ui-muted-foreground)]">
              {isAr ? "شفافية الخريطة الحرارية:" : "Heatmap Opacity:"}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
              className="h-1.5 w-28 sm:w-36 cursor-pointer accent-[var(--color-primary-500)]"
              aria-label={isAr ? "شفافية الخريطة الحرارية" : "Heatmap Opacity"}
            />
            <span className="font-bold text-[var(--ui-foreground)] w-9">{heatmapOpacity}%</span>
          </div>
        ) : (
          <div className="text-[11px] font-medium text-[var(--ui-muted-foreground)]">
            {isAr ? "عدسة الفحص السريري المباشر" : "Clinical Diagnostic Viewport"}
          </div>
        )}

        {/* Zoom & Viewport Manipulation Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            title={isAr ? "تكبير (+)" : "Zoom In (+)"}
            aria-label="Zoom in"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--ui-border)] hover:bg-[var(--ui-surface-2)] transition"
          >
            <FaSearchPlus className="h-3.5 w-3.5" />
          </button>
          <span className="px-1 text-[11px] font-bold text-[var(--ui-foreground)]">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomOut}
            title={isAr ? "تصغير (-)" : "Zoom Out (-)"}
            aria-label="Zoom out"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--ui-border)] hover:bg-[var(--ui-surface-2)] transition"
          >
            <FaSearchMinus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            title={isAr ? "إعادة ضبط التكبير" : "Reset Zoom"}
            aria-label="Reset zoom"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--ui-border)] hover:bg-[var(--ui-surface-2)] transition"
          >
            <FaUndo className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setInvertColors((v) => !v)}
            title={isAr ? "عكس الألوان (PACS High-Contrast)" : "Invert Monochrome (High-Contrast)"}
            aria-label="Invert colors"
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
              invertColors
                ? "border-amber-400 bg-amber-400/20 text-amber-500"
                : "border-[var(--ui-border)] hover:bg-[var(--ui-surface-2)]"
            }`}
          >
            <FaAdjust className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            title={isFullscreen ? (isAr ? "إنهاء ملء الشاشة" : "Exit Fullscreen") : (isAr ? "ملء الشاشة" : "Fullscreen")}
            aria-label="Toggle fullscreen"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--ui-border)] hover:bg-[var(--ui-surface-2)] transition"
          >
            {isFullscreen ? <FaCompress className="h-3.5 w-3.5" /> : <FaExpand className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Image Viewport Area */}
      <div className={`relative flex items-center justify-center overflow-hidden bg-slate-950 p-4 min-h-[360px] sm:min-h-[440px] ${isFullscreen ? "flex-1" : ""}`}>
        {/* Layer Overlay Mode */}
        {hasBoth && viewMode === "overlay" && (
          <div
            className="relative flex items-center justify-center transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Original X-Ray Base */}
            <img
              src={originalImageUrl!}
              alt={isAr ? "صورة الأشعة السينية الأصلية" : "Original Chest X-Ray"}
              style={{ filter: imageFilterStyle }}
              className="max-h-[520px] max-w-full rounded-xl object-contain shadow-2xl"
            />
            {/* Grad-CAM Heatmap Top Layer */}
            <img
              src={heatmapUrl!}
              alt={isAr ? "خريطة التفسير الحراري Grad-CAM" : "Grad-CAM Heatmap Layer"}
              style={{
                opacity: heatmapOpacity / 100,
                mixBlendMode: "screen",
              }}
              className="absolute inset-0 h-full w-full rounded-xl object-contain pointer-events-none"
            />
          </div>
        )}

        {/* Side-by-Side Mode */}
        {hasBoth && viewMode === "sideBySide" && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <div className="relative rounded-2xl border border-white/10 bg-slate-900/60 p-2 text-center">
              <span className="absolute top-4 start-4 z-10 rounded-lg bg-slate-950/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                {isAr ? "الأصلية" : "Original X-Ray"}
              </span>
              <img
                src={originalImageUrl!}
                alt="Original"
                style={{ filter: imageFilterStyle }}
                className="max-h-[440px] w-full rounded-xl object-contain mx-auto"
              />
            </div>
            <div className="relative rounded-2xl border border-white/10 bg-slate-900/60 p-2 text-center">
              <span className="absolute top-4 start-4 z-10 rounded-lg bg-slate-950/80 px-2.5 py-1 text-[11px] font-bold text-sky-300 backdrop-blur-xs">
                {isAr ? "خريطة Grad-CAM" : "Grad-CAM Heatmap"}
              </span>
              <img
                src={heatmapUrl!}
                alt="Heatmap"
                className="max-h-[440px] w-full rounded-xl object-contain mx-auto"
              />
            </div>
          </div>
        )}

        {/* Single Original Mode */}
        {originalImageUrl && viewMode === "original" && (
          <div
            className="relative flex items-center justify-center transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={originalImageUrl}
              alt="Original X-Ray"
              style={{ filter: imageFilterStyle }}
              className="max-h-[540px] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        )}

        {/* Single Heatmap Mode */}
        {heatmapUrl && viewMode === "heatmap" && (
          <div
            className="relative flex items-center justify-center transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={heatmapUrl}
              alt="Grad-CAM Heatmap"
              className="max-h-[540px] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        )}
      </div>

      {/* Viewer Footer Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ui-border)] bg-[var(--ui-surface-2)]/60 px-4 py-3 sm:px-6 text-xs">
        <div className="flex items-center gap-2 text-[var(--ui-muted-foreground)]">
          <FaXRay className="text-[var(--color-primary-500)]" />
          <span>
            {isAr
              ? "ملاحظة: هذا التمثيل البصري مساعد سريرياً؛ يظل القرار النهائي بيد الطبيب المعالج."
              : "Diagnostic disclaimer: Visualizations are intended to assist clinical review, not replace physician judgment."}
          </span>
        </div>
        {typeof confidence === "number" && confidence > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--ui-muted-foreground)]">
              {isAr ? "مستوى الثقة النموذجي:" : "Confidence Score:"}
            </span>
            <span className="rounded-full bg-[var(--ui-surface)] px-2.5 py-0.5 font-bold text-[var(--ui-foreground)] border border-[var(--ui-border)]">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MedicalImageViewer;

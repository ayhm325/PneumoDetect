import {
  CircleCheckIcon,
  ClockIcon,
  Columns2Icon,
  ContrastIcon,
  CpuIcon,
  LayersIcon,
  MaximizeIcon,
  MinimizeIcon,
  ScanLineIcon,
  TriangleAlertIcon,
  Undo2Icon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [invertColors, setInvertColors] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; origX: number; origY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const isNormal = Boolean(prediction && String(prediction).toLowerCase().includes("normal"));
  const hasBoth = Boolean(originalImageUrl && heatmapUrl);
  const imageFilterStyle = invertColors ? "invert(1) contrast(1.06)" : "none";

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => {
    setZoomLevel((z) => {
      const next = Math.max(z - 0.25, 0.75);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetView = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    setInvertColors(false);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: pan.x,
      origY: pan.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    setPan({
      x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.origY + (e.clientY - dragRef.current.startY),
    });
  };

  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  const transformStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
  };

  return (
    <div
      className={`pd-panel pd-panel--feature relative overflow-hidden transition-all ${
        isFullscreen
          ? "fixed inset-0 z-[var(--z-modal,210)] flex flex-col !rounded-none bg-[var(--pd-canvas)] p-4 sm:p-6"
          : className
      }`}
    >
      {/* Clinical Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className={`pd-orb pd-orb--sm ${isNormal ? "pd-orb--moss" : "pd-orb--marigold"}`}>
            {isNormal ? (
              <CircleCheckIcon size={17} strokeWidth={1.7} />
            ) : (
              <TriangleAlertIcon size={17} strokeWidth={1.7} />
            )}
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--pd-text-muted)]">
              {isAr ? "نتيجة الفحص السريري" : "Screening Assessment"}
            </div>
            <div className="text-base font-semibold text-[var(--pd-text-primary)]">
              {prediction || (isAr ? "تحليل الأشعة" : "Chest X-Ray Analysis")}
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        {hasBoth && (
          <div className="pd-segmented">
            <button
              type="button"
              onClick={() => setViewMode("overlay")}
              className={`pd-chip !min-h-7 !border-0 !px-2.5 !py-1 !text-xs ${
                viewMode === "overlay" ? "pd-chip--active" : ""
              }`}
            >
              <LayersIcon size={13} strokeWidth={1.7} />
              <span>{isAr ? "تطابق الطبقات" : "Layer Overlay"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("sideBySide")}
              className={`pd-chip !min-h-7 !border-0 !px-2.5 !py-1 !text-xs ${
                viewMode === "sideBySide" ? "pd-chip--active" : ""
              }`}
            >
              <Columns2Icon size={13} strokeWidth={1.7} />
              <span>{isAr ? "جنباً إلى جنب" : "Side-by-Side"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("original")}
              className={`pd-chip !min-h-7 !border-0 !px-2.5 !py-1 !text-xs ${
                viewMode === "original" ? "pd-chip--active" : ""
              }`}
            >
              <span>{isAr ? "الأصلية" : "Original"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("heatmap")}
              className={`pd-chip !min-h-7 !border-0 !px-2.5 !py-1 !text-xs ${
                viewMode === "heatmap" ? "pd-chip--active" : ""
              }`}
            >
              <span>{isAr ? "الخريطة" : "Heatmap"}</span>
            </button>
          </div>
        )}

        {/* Telemetry */}
        <div className="pd-tabular flex items-center gap-3 text-xs text-[var(--pd-text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <CpuIcon size={14} strokeWidth={1.7} className="text-[var(--pd-orchid)]" />
            <code>{modelVersion}</code>
          </span>
          {typeof inferenceTimeMs === "number" && inferenceTimeMs > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon size={14} strokeWidth={1.7} className="text-[var(--pd-acid)]" />
              <span>{inferenceTimeMs}ms</span>
            </span>
          )}
        </div>
      </div>

      {/* Interactive Controls Bar (outside anatomical image area) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pd-line)] bg-[var(--pd-surface)] px-4 py-2.5 text-xs sm:px-6">
        {hasBoth && viewMode === "overlay" ? (
          <div className="flex items-center gap-2.5">
            <span className="font-medium text-[var(--pd-text-secondary)]">
              {isAr ? "شفافية الخريطة الحرارية:" : "Heatmap Opacity:"}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
              className="h-1.5 w-28 cursor-pointer accent-[var(--pd-acid)] sm:w-36"
              aria-label={isAr ? "شفافية الخريطة الحرارية" : "Heatmap Opacity"}
            />
            <span className="pd-tabular w-9 font-semibold text-[var(--pd-text-primary)]">
              {heatmapOpacity}%
            </span>
          </div>
        ) : (
          <div className="text-[11px] font-medium text-[var(--pd-text-muted)]">
            {isAr ? "عدسة الفحص السريري المباشر" : "Clinical Diagnostic Viewport"}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            title={isAr ? "تكبير (+)" : "Zoom In (+)"}
            aria-label="Zoom in"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] text-[var(--pd-text-secondary)] transition-colors hover:border-[var(--pd-line-strong)] hover:text-[var(--pd-text-primary)]"
          >
            <ZoomInIcon size={14} strokeWidth={1.7} />
          </button>
          <span className="pd-tabular px-1 text-[11px] font-semibold text-[var(--pd-text-primary)]">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomOut}
            title={isAr ? "تصغير (-)" : "Zoom Out (-)"}
            aria-label="Zoom out"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] text-[var(--pd-text-secondary)] transition-colors hover:border-[var(--pd-line-strong)] hover:text-[var(--pd-text-primary)]"
          >
            <ZoomOutIcon size={14} strokeWidth={1.7} />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            title={isAr ? "إعادة ضبط العرض" : "Fit / Reset View"}
            aria-label="Reset view"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] text-[var(--pd-text-secondary)] transition-colors hover:border-[var(--pd-line-strong)] hover:text-[var(--pd-text-primary)]"
          >
            <Undo2Icon size={13} strokeWidth={1.7} />
          </button>
          <button
            type="button"
            onClick={() => setInvertColors((v) => !v)}
            title={isAr ? "عكس التباين الأحادي" : "Invert Monochrome"}
            aria-label="Invert colors"
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
              invertColors
                ? "border-[var(--pd-marigold)] bg-[var(--pd-marigold-soft)] text-[var(--pd-marigold)]"
                : "border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] text-[var(--pd-text-secondary)] hover:border-[var(--pd-line-strong)]"
            }`}
          >
            <ContrastIcon size={14} strokeWidth={1.7} />
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            title={
              isFullscreen
                ? isAr
                  ? "إنهاء ملء الشاشة"
                  : "Exit Fullscreen"
                : isAr
                  ? "ملء الشاشة"
                  : "Fullscreen"
            }
            aria-label="Toggle fullscreen"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] text-[var(--pd-text-secondary)] transition-colors hover:border-[var(--pd-line-strong)] hover:text-[var(--pd-text-primary)]"
          >
            {isFullscreen ? <MinimizeIcon size={14} strokeWidth={1.7} /> : <MaximizeIcon size={14} strokeWidth={1.7} />}
          </button>
        </div>
      </div>

      {/* Main Radiograph Viewport — pure neutral near-black stage so grayscale pixels remain unaltered */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative flex min-h-[360px] select-none items-center justify-center overflow-hidden bg-[var(--pd-stage)] p-4 sm:min-h-[440px] ${
          zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : ""
        } ${isFullscreen ? "flex-1" : ""}`}
      >
        {hasBoth && viewMode === "overlay" && (
          <div className="relative flex items-center justify-center transition-transform duration-150" style={transformStyle}>
            <img
              src={originalImageUrl!}
              alt={isAr ? "صورة الأشعة السينية الأصلية" : "Original Chest X-Ray"}
              style={{ filter: imageFilterStyle }}
              draggable={false}
              className="max-h-[520px] max-w-full rounded-[var(--shape-control)] object-contain shadow-2xl"
            />
            <img
              src={heatmapUrl!}
              alt={isAr ? "خريطة التفسير الحراري Grad-CAM" : "Grad-CAM Heatmap Layer"}
              style={{
                opacity: heatmapOpacity / 100,
                mixBlendMode: "screen",
              }}
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full rounded-[var(--shape-control)] object-contain"
            />
          </div>
        )}

        {hasBoth && viewMode === "sideBySide" && (
          <div
            className="grid w-full max-w-5xl grid-cols-1 gap-4 transition-transform duration-150 md:grid-cols-2"
            style={transformStyle}
          >
            <div className="relative rounded-[var(--shape-control)] border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] p-2 text-center">
              <span className="absolute top-3.5 start-3.5 z-10 rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas)]/90 px-2.5 py-0.5 text-[11px] font-medium text-[var(--pd-text-primary)]">
                {isAr ? "الأصلية" : "Original X-Ray"}
              </span>
              <img
                src={originalImageUrl!}
                alt="Original"
                style={{ filter: imageFilterStyle }}
                draggable={false}
                className="mx-auto max-h-[440px] w-full rounded-lg object-contain"
              />
            </div>
            <div className="relative rounded-[var(--shape-control)] border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] p-2 text-center">
              <span className="absolute top-3.5 start-3.5 z-10 rounded-full border border-[color-mix(in_srgb,var(--pd-acid)_30%,transparent)] bg-[var(--pd-canvas)]/90 px-2.5 py-0.5 text-[11px] font-medium text-[var(--pd-acid)]">
                {isAr ? "خريطة Grad-CAM" : "Grad-CAM Heatmap"}
              </span>
              <img
                src={heatmapUrl!}
                alt="Heatmap"
                draggable={false}
                className="mx-auto max-h-[440px] w-full rounded-lg object-contain"
              />
            </div>
          </div>
        )}

        {originalImageUrl && viewMode === "original" && (
          <div className="relative flex items-center justify-center transition-transform duration-150" style={transformStyle}>
            <img
              src={originalImageUrl}
              alt="Original X-Ray"
              style={{ filter: imageFilterStyle }}
              draggable={false}
              className="max-h-[540px] max-w-full rounded-[var(--shape-control)] object-contain shadow-2xl"
            />
          </div>
        )}

        {heatmapUrl && viewMode === "heatmap" && (
          <div className="relative flex items-center justify-center transition-transform duration-150" style={transformStyle}>
            <img
              src={heatmapUrl}
              alt="Grad-CAM Heatmap"
              draggable={false}
              className="max-h-[540px] max-w-full rounded-[var(--shape-control)] object-contain shadow-2xl"
            />
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] px-4 py-3 text-xs sm:px-6">
        <div className="flex items-center gap-2 text-[var(--pd-text-muted)]">
          <ScanLineIcon size={15} strokeWidth={1.7} className="text-[var(--pd-acid)]" />
          <span>
            {isAr
              ? "ملاحظة: هذا التمثيل البصري مساعد سريرياً؛ يظل القرار النهائي بيد الطبيب المعالج."
              : "Diagnostic disclaimer: Visualizations are intended to assist clinical review, not replace physician judgment."}
          </span>
        </div>
        {typeof confidence === "number" && confidence > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--pd-text-muted)]">
              {isAr ? "مستوى الثقة النموذجي:" : "Confidence Score:"}
            </span>
            <span className="pd-tabular rounded-full border border-[var(--pd-line-strong)] bg-[var(--pd-surface)] px-3 py-0.5 font-semibold text-[var(--pd-acid)]">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MedicalImageViewer;

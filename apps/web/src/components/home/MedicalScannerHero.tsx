import { CpuIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function MedicalScannerHero() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scanActive, setScanActive] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let scanY = 110;
    let scanDirection = 1;
    let pulsePhase = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = 480;
    const height = 480;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 },
    );
    if (containerRef.current) observer.observe(containerRef.current);

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 1. Equal 4-color radial glow (#BD4444, #73976A, #677E61, #F1DEC4)
      const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 220);
      bgGrad.addColorStop(0, "rgba(189, 68, 68, 0.22)");
      bgGrad.addColorStop(0.45, "rgba(115, 151, 106, 0.18)");
      bgGrad.addColorStop(0.75, "rgba(103, 126, 97, 0.12)");
      bgGrad.addColorStop(1, "rgba(241, 222, 196, 0)");
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 220, 0, Math.PI * 2);
      ctx.fill();

      // 2. Spatial coordinate rings in parchment
      ctx.lineWidth = 1;
      for (let r = 80; r <= 200; r += 60) {
        ctx.strokeStyle = `rgba(241, 222, 196, ${0.2 - (r / 200) * 0.08})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Bilateral lung contours
      pulsePhase += 0.025;
      const breathingScale = isReducedMotion ? 1 : 1 + Math.sin(pulsePhase) * 0.018;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(breathingScale, breathingScale);
      ctx.translate(-cx, -cy);

      const leftLungGrad = ctx.createLinearGradient(120, 100, 210, 360);
      leftLungGrad.addColorStop(0, "rgba(189, 68, 68, 0.36)");
      leftLungGrad.addColorStop(0.5, "rgba(115, 151, 106, 0.34)");
      leftLungGrad.addColorStop(1, "rgba(241, 222, 196, 0.24)");

      ctx.beginPath();
      ctx.moveTo(190, 120);
      ctx.bezierCurveTo(150, 130, 130, 190, 130, 260);
      ctx.bezierCurveTo(130, 330, 160, 360, 200, 360);
      ctx.bezierCurveTo(220, 340, 220, 260, 215, 200);
      ctx.bezierCurveTo(210, 150, 200, 120, 190, 120);
      ctx.closePath();
      ctx.fillStyle = leftLungGrad;
      ctx.fill();
      ctx.strokeStyle = "#F1DEC4";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      const rightLungGrad = ctx.createLinearGradient(270, 100, 360, 360);
      rightLungGrad.addColorStop(0, "rgba(103, 126, 97, 0.42)");
      rightLungGrad.addColorStop(0.5, "rgba(189, 68, 68, 0.32)");
      rightLungGrad.addColorStop(1, "rgba(241, 222, 196, 0.24)");

      ctx.beginPath();
      ctx.moveTo(290, 120);
      ctx.bezierCurveTo(330, 130, 350, 190, 350, 260);
      ctx.bezierCurveTo(350, 330, 320, 360, 280, 360);
      ctx.bezierCurveTo(260, 340, 260, 260, 265, 200);
      ctx.bezierCurveTo(270, 150, 280, 120, 290, 120);
      ctx.closePath();
      ctx.fillStyle = rightLungGrad;
      ctx.fill();
      ctx.strokeStyle = "#F1DEC4";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Bronchial tree stem
      ctx.strokeStyle = "rgba(241, 222, 196, 0.48)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(240, 90);
      ctx.lineTo(240, 190);
      ctx.lineTo(210, 230);
      ctx.moveTo(240, 190);
      ctx.lineTo(270, 230);
      ctx.stroke();

      const nodes = [
        { x: 170, y: 240, color: "#BD4444" },
        { x: 310, y: 250, color: "#73976A" },
        { x: 185, y: 310, color: "#F1DEC4" },
        { x: 295, y: 300, color: "#677E61" },
      ];

      nodes.forEach((node, idx) => {
        const nodePulse = Math.sin(pulsePhase * 2 + idx) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, 7 + nodePulse * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(241, 222, 196, ${0.45 - nodePulse * 0.25})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      ctx.restore();

      // 4. Crimson-Parchment-Sage scanning beam
      if (!isReducedMotion && scanActive) {
        scanY += scanDirection * 1.65;
        if (scanY > 370) scanDirection = -1;
        if (scanY < 90) scanDirection = 1;

        const scanGrad = ctx.createLinearGradient(110, scanY, 370, scanY);
        scanGrad.addColorStop(0, "rgba(189, 68, 68, 0)");
        scanGrad.addColorStop(0.28, "rgba(189, 68, 68, 0.85)");
        scanGrad.addColorStop(0.5, "rgba(241, 222, 196, 0.95)");
        scanGrad.addColorStop(0.72, "rgba(115, 151, 106, 0.85)");
        scanGrad.addColorStop(1, "rgba(103, 126, 97, 0)");

        ctx.strokeStyle = scanGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(110, scanY);
        ctx.lineTo(370, scanY);
        ctx.stroke();

        const glowGrad = ctx.createLinearGradient(0, scanY - scanDirection * 22, 0, scanY);
        glowGrad.addColorStop(0, "rgba(189, 68, 68, 0)");
        glowGrad.addColorStop(1, "rgba(189, 68, 68, 0.16)");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(110, Math.min(scanY, scanY - scanDirection * 22), 260, 22);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [scanActive, isReducedMotion]);

  return (
    <div
      ref={containerRef}
      className="pd-shape-arch relative flex items-center justify-center overflow-hidden border border-[var(--pd-border)] bg-[var(--pd-surface-inset)] p-4 sm:p-6 shadow-[var(--pd-shadow-deep)]"
    >
      <div className="pd-grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />

      <canvas
        ref={canvasRef}
        style={{ width: "100%", maxWidth: 440, height: "auto", aspectRatio: "1/1" }}
        className="relative z-10"
        aria-label={
          isAr
            ? "تصور بصري ذكي لفحص الرئتين وتحليل الأشعة"
            : "Intelligent bilateral lung scanner visualization"
        }
      />

      <div className="absolute top-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[var(--pd-border-strong)] bg-[var(--pd-bg)]/90 px-3.5 py-1.5 text-xs font-medium text-[var(--pd-text-primary)] backdrop-blur-md">
        <CpuIcon size={14} strokeWidth={1.7} className="text-[var(--pd-copper)]" />
        <span>DenseNet121 + Grad-CAM</span>
      </div>

      <div className="absolute bottom-4 start-4 z-20 flex items-center gap-2 rounded-full border border-[var(--pd-border-strong)] bg-[var(--pd-bg)]/90 px-3.5 py-1.5 text-xs font-medium text-[var(--pd-text-primary)] backdrop-blur-md">
        <span className="pd-breathe inline-block h-2 w-2 rounded-full bg-[var(--pd-sage)]" />
        <span>{isAr ? "نظام الفرز السريري نشط" : "Clinical Screening Active"}</span>
      </div>

      <div className="absolute bottom-4 end-4 z-20">
        <button
          type="button"
          onClick={() => setScanActive((v) => !v)}
          className="rounded-full border border-[var(--pd-border-strong)] bg-[var(--pd-bg)]/90 px-3 py-1 text-[11px] font-medium text-[var(--pd-text-secondary)] backdrop-blur-md transition-colors hover:border-[var(--pd-copper)] hover:text-[var(--pd-copper)]"
        >
          {scanActive
            ? isAr ? "إيقاف المسح" : "Pause Scan"
            : isAr ? "تشغيل المسح" : "Resume Scan"}
        </button>
      </div>
    </div>
  );
}

export default MedicalScannerHero;

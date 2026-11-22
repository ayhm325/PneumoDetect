import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaMicrochip, FaShieldAlt, FaWaveSquare } from "react-icons/fa";

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
    let scanY = 0;
    let scanDirection = 1;
    let pulsePhase = 0;

    // Handle high DPI displays cleanly
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = 480;
    const height = 480;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Pause rendering when tab or element is not visible
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

      // 1. Draw subtle clinical radial background glow
      const cx = width / 2;
      const cy = height / 2;
      const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 220);
      bgGrad.addColorStop(0, "rgba(53, 106, 230, 0.14)");
      bgGrad.addColorStop(0.5, "rgba(19, 168, 158, 0.08)");
      bgGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 220, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw circular spatial coordinate rings
      ctx.lineWidth = 1;
      for (let r = 80; r <= 200; r += 60) {
        ctx.strokeStyle = `rgba(53, 106, 230, ${0.12 - (r / 200) * 0.06})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Draw stylized bilateral lung anatomical contours with soft luminous gradients
      pulsePhase += 0.03;
      const breathingScale = isReducedMotion ? 1 : 1 + Math.sin(pulsePhase) * 0.02;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(breathingScale, breathingScale);
      ctx.translate(-cx, -cy);

      // Left Lung
      const leftLungGrad = ctx.createLinearGradient(120, 100, 210, 360);
      leftLungGrad.addColorStop(0, "rgba(56, 189, 248, 0.35)");
      leftLungGrad.addColorStop(0.6, "rgba(19, 168, 158, 0.28)");
      leftLungGrad.addColorStop(1, "rgba(53, 106, 230, 0.15)");

      ctx.beginPath();
      ctx.moveTo(190, 120);
      ctx.bezierCurveTo(150, 130, 130, 190, 130, 260);
      ctx.bezierCurveTo(130, 330, 160, 360, 200, 360);
      ctx.bezierCurveTo(220, 340, 220, 260, 215, 200);
      ctx.bezierCurveTo(210, 150, 200, 120, 190, 120);
      ctx.closePath();
      ctx.fillStyle = leftLungGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Right Lung
      const rightLungGrad = ctx.createLinearGradient(270, 100, 360, 360);
      rightLungGrad.addColorStop(0, "rgba(56, 189, 248, 0.35)");
      rightLungGrad.addColorStop(0.6, "rgba(19, 168, 158, 0.28)");
      rightLungGrad.addColorStop(1, "rgba(53, 106, 230, 0.15)");

      ctx.beginPath();
      ctx.moveTo(290, 120);
      ctx.bezierCurveTo(330, 130, 350, 190, 350, 260);
      ctx.bezierCurveTo(350, 330, 320, 360, 280, 360);
      ctx.bezierCurveTo(260, 340, 260, 260, 265, 200);
      ctx.bezierCurveTo(270, 150, 280, 120, 290, 120);
      ctx.closePath();
      ctx.fillStyle = rightLungGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Trachea / Bronchial Tree Stem
      ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(240, 90);
      ctx.lineTo(240, 190);
      ctx.lineTo(210, 230);
      ctx.moveTo(240, 190);
      ctx.lineTo(270, 230);
      ctx.stroke();

      // Detection Nodal Points with pulsing rings
      const nodes = [
        { x: 170, y: 240, label: "Zone L-Mid" },
        { x: 310, y: 250, label: "Zone R-Mid" },
        { x: 185, y: 310, label: "Zone L-Base" },
        { x: 295, y: 300, label: "Zone R-Base" },
      ];

      nodes.forEach((node, idx) => {
        const nodePulse = Math.sin(pulsePhase * 2 + idx) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, 7 + nodePulse * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 - nodePulse * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      ctx.restore();

      // 4. Draw Animated Medical Laser Scanning Line
      if (!isReducedMotion && scanActive) {
        scanY += scanDirection * 1.8;
        if (scanY > 370) scanDirection = -1;
        if (scanY < 90) scanDirection = 1;

        const scanGrad = ctx.createLinearGradient(100, scanY, 380, scanY);
        scanGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
        scanGrad.addColorStop(0.3, "rgba(56, 189, 248, 0.7)");
        scanGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
        scanGrad.addColorStop(0.7, "rgba(19, 168, 158, 0.7)");
        scanGrad.addColorStop(1, "rgba(19, 168, 158, 0)");

        ctx.strokeStyle = scanGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(110, scanY);
        ctx.lineTo(370, scanY);
        ctx.stroke();

        // Soft laser trailing glow
        const glowGrad = ctx.createLinearGradient(
          0,
          scanY - scanDirection * 20,
          0,
          scanY,
        );
        glowGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
        glowGrad.addColorStop(1, "rgba(56, 189, 248, 0.12)");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(110, Math.min(scanY, scanY - scanDirection * 20), 260, 20);
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
      className="relative flex items-center justify-center overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-4 sm:p-6 shadow-[var(--shadow-lift)]"
    >
      {/* Background Spatial Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(53,106,230,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(53,106,230,0.06)_1px,transparent_1px)] bg-[size:28px_28px]"
        aria-hidden="true"
      />

      {/* Interactive Medical Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", maxWidth: 440, height: "auto", aspectRatio: "1/1" }}
        className="relative z-10 transition-transform duration-300"
        aria-label={
          isAr
            ? "تصور بصري ذكي لفحص الرئتين وتحليل الأشعة"
            : "Intelligent bilateral lung scanner visualization"
        }
      />

      {/* Floating Spatial Clinical Telemetry Badges */}
      <div className="absolute top-4 start-4 z-20 flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md">
        <FaMicrochip className="h-3.5 w-3.5 text-sky-400" />
        <span>DenseNet121 + Grad-CAM</span>
      </div>

      <div className="absolute bottom-4 start-4 z-20 flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span>{isAr ? "نظام الفرز السريري نشط" : "Clinical Screening Active"}</span>
      </div>

      <div className="absolute top-4 end-4 z-20 hidden sm:flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-sky-200 shadow-md backdrop-blur-md">
        <FaWaveSquare className="h-3.5 w-3.5 text-teal-300" />
        <span>{isAr ? "مجال رئوي ثنائي" : "Bilateral Fields"}</span>
      </div>

      <div className="absolute bottom-4 end-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setScanActive((v) => !v)}
          className="rounded-lg border border-white/15 bg-slate-900/85 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white backdrop-blur-md transition"
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

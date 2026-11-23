import { ActivityIcon, CpuIcon, LayersIcon, PlayIcon, PauseIcon, SparklesIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function MedicalScannerHero() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const smoothPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scanActive, setScanActive] = useState(true);
  const [gradCamMode, setGradCamMode] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el || isReducedMotion) return;
    const rect = el.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    pointerRef.current = { x: nx, y: ny };
  };

  const handlePointerLeave = () => {
    pointerRef.current = { x: 0, y: 0 };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let scanY = 120;
    let scanDirection = 1;
    let pulsePhase = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = 500;
    const height = 500;
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

    const drawLeftLungPath = (c: CanvasRenderingContext2D, ox = 0, oy = 0) => {
      c.beginPath();
      c.moveTo(192 + ox, 114 + oy);
      c.bezierCurveTo(146 + ox, 122 + oy, 118 + ox, 184 + oy, 118 + ox, 262 + oy);
      c.bezierCurveTo(118 + ox, 336 + oy, 154 + ox, 368 + oy, 198 + ox, 366 + oy);
      c.bezierCurveTo(222 + ox, 344 + oy, 222 + ox, 262 + oy, 217 + ox, 198 + oy);
      c.bezierCurveTo(212 + ox, 144 + oy, 202 + ox, 114 + oy, 192 + ox, 114 + oy);
      c.closePath();
    };

    const drawRightLungPath = (c: CanvasRenderingContext2D, ox = 0, oy = 0) => {
      c.beginPath();
      c.moveTo(308 + ox, 114 + oy);
      c.bezierCurveTo(354 + ox, 122 + oy, 382 + ox, 184 + oy, 382 + ox, 262 + oy);
      c.bezierCurveTo(382 + ox, 336 + oy, 346 + ox, 368 + oy, 302 + ox, 366 + oy);
      c.bezierCurveTo(278 + ox, 344 + oy, 278 + ox, 262 + oy, 283 + ox, 198 + oy);
      c.bezierCurveTo(288 + ox, 144 + oy, 298 + ox, 114 + oy, 308 + ox, 114 + oy);
      c.closePath();
    };

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Smooth pointer parallax interpolation
      smoothPointerRef.current.x += (pointerRef.current.x - smoothPointerRef.current.x) * 0.08;
      smoothPointerRef.current.y += (pointerRef.current.y - smoothPointerRef.current.y) * 0.08;
      const px = smoothPointerRef.current.x;
      const py = smoothPointerRef.current.y;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      pulsePhase += isReducedMotion ? 0 : 0.025;
      const autoYaw = isReducedMotion ? 0 : Math.sin(pulsePhase * 0.7) * 5;
      const autoPitch = isReducedMotion ? 0 : Math.cos(pulsePhase * 0.5) * 3.5;

      // 1. Deep 3D volumetric atmospheric glow
      const bgGrad = ctx.createRadialGradient(
        cx + px * 14,
        cy + py * 14,
        24,
        cx,
        cy,
        235,
      );
      bgGrad.addColorStop(0, gradCamMode ? "rgba(189, 68, 68, 0.34)" : "rgba(115, 151, 106, 0.24)");
      bgGrad.addColorStop(0.42, "rgba(115, 151, 106, 0.22)");
      bgGrad.addColorStop(0.75, "rgba(103, 126, 97, 0.14)");
      bgGrad.addColorStop(1, "rgba(241, 222, 196, 0)");
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 235, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Holographic Base Pedestal (perspective ellipses at bottom)
      ctx.save();
      const baseX = cx - px * 6;
      const baseY = 412 - py * 4;
      const baseGrad = ctx.createRadialGradient(baseX, baseY, 10, baseX, baseY, 150);
      baseGrad.addColorStop(0, "rgba(189, 68, 68, 0.28)");
      baseGrad.addColorStop(0.55, "rgba(115, 151, 106, 0.16)");
      baseGrad.addColorStop(1, "rgba(241, 222, 196, 0)");
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.ellipse(baseX, baseY, 148, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      [136, 104, 70].forEach((rx, idx) => {
        ctx.beginPath();
        ctx.ellipse(baseX, baseY + idx * 2, rx, rx * 0.19, 0, 0, Math.PI * 2);
        ctx.strokeStyle =
          idx === 0
            ? "rgba(241, 222, 196, 0.28)"
            : idx === 1
              ? "rgba(115, 151, 106, 0.36)"
              : "rgba(189, 68, 68, 0.42)";
        ctx.lineWidth = idx === 0 ? 1.4 : 1;
        if (idx === 1) ctx.setLineDash([6, 6]);
        else ctx.setLineDash([]);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.restore();

      // 3. 3D Orbital Gyroscope Rings around the lungs
      ctx.save();
      ctx.translate(cx - px * 4, cy - 10 - py * 4);
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 3 + pulsePhase * 0.18 * (i % 2 === 0 ? 1 : -1));
        ctx.beginPath();
        ctx.ellipse(0, 0, 196 - i * 16, 68 + i * 26, 0, 0, Math.PI * 2);
        ctx.strokeStyle =
          i === 0
            ? "rgba(241, 222, 196, 0.16)"
            : i === 1
              ? "rgba(115, 151, 106, 0.20)"
              : "rgba(189, 68, 68, 0.18)";
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // 4. Posterior 3D Spine & Rib-Cage Depth Arcs (Parallax back layer)
      ctx.save();
      const backX = -px * 8 + autoYaw * 0.4;
      const backY = -py * 8 + autoPitch * 0.4;

      // Vertebral column 3D segments
      for (let v = 96; v <= 346; v += 22) {
        const segGrad = ctx.createLinearGradient(cx - 10 + backX, v + backY, cx + 10 + backX, v + 14 + backY);
        segGrad.addColorStop(0, "rgba(241, 222, 196, 0.25)");
        segGrad.addColorStop(1, "rgba(103, 126, 97, 0.12)");
        ctx.fillStyle = segGrad;
        ctx.beginPath();
        ctx.roundRect(cx - 8 + backX, v + backY, 16, 13, 4);
        ctx.fill();
      }

      // Posterior rib arcs
      for (let rib = 0; rib < 5; rib++) {
        const ry = 148 + rib * 36 + backY;
        const rw = 115 + Math.sin((rib / 4) * Math.PI) * 32;
        ctx.beginPath();
        ctx.ellipse(cx + backX, ry, rw, 22, 0, Math.PI * 1.1, Math.PI * 1.9);
        ctx.strokeStyle = `rgba(241, 222, 196, ${0.14 - rib * 0.015})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      // 5. Volumetric 3D Bilateral Lungs (Multi-slice depth extrusion + specular glass)
      const breathingScale = isReducedMotion ? 1 : 1 + Math.sin(pulsePhase) * 0.022;
      const lungShiftX = px * 10 + autoYaw;
      const lungShiftY = py * 10 + autoPitch;

      ctx.save();
      ctx.translate(cx + lungShiftX, cy + lungShiftY);
      ctx.scale(breathingScale, breathingScale);
      ctx.translate(-cx, -cy);

      // 5a. Deep 3D Extrusion Slices (back-to-front volumetric stack)
      const depthSlices = [
        { dx: -9, dy: 12, alpha: 0.18, stroke: "rgba(103, 126, 97, 0.35)" },
        { dx: -6, dy: 8, alpha: 0.26, stroke: "rgba(115, 151, 106, 0.45)" },
        { dx: -3, dy: 4, alpha: 0.36, stroke: "rgba(189, 68, 68, 0.48)" },
      ];

      depthSlices.forEach((slice) => {
        drawLeftLungPath(ctx, slice.dx, slice.dy);
        ctx.fillStyle = `rgba(28, 39, 30, ${slice.alpha})`;
        ctx.fill();
        ctx.strokeStyle = slice.stroke;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        drawRightLungPath(ctx, -slice.dx, slice.dy);
        ctx.fillStyle = `rgba(28, 39, 30, ${slice.alpha})`;
        ctx.fill();
        ctx.strokeStyle = slice.stroke;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // 5b. Cylindrical 3D Trachea & Bronchial Stem (with inner highlight)
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // Shadow pass
      ctx.strokeStyle = "rgba(15, 22, 17, 0.65)";
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.moveTo(250, 78);
      ctx.lineTo(250, 188);
      ctx.lineTo(208, 232);
      ctx.moveTo(250, 188);
      ctx.lineTo(292, 232);
      ctx.stroke();

      // Main 3D body pass
      const tracheaGrad = ctx.createLinearGradient(238, 78, 262, 232);
      tracheaGrad.addColorStop(0, "#F1DEC4");
      tracheaGrad.addColorStop(0.5, "#73976A");
      tracheaGrad.addColorStop(1, "#677E61");
      ctx.strokeStyle = tracheaGrad;
      ctx.lineWidth = 9.5;
      ctx.beginPath();
      ctx.moveTo(250, 78);
      ctx.lineTo(250, 188);
      ctx.lineTo(208, 232);
      ctx.moveTo(250, 188);
      ctx.lineTo(292, 232);
      ctx.stroke();

      // Specular tube highlight
      ctx.strokeStyle = "rgba(250, 240, 225, 0.78)";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(248, 80);
      ctx.lineTo(248, 186);
      ctx.lineTo(206, 230);
      ctx.moveTo(248, 186);
      ctx.lineTo(290, 230);
      ctx.stroke();

      // Tracheal cartilage 3D rings
      for (let ty = 92; ty <= 172; ty += 16) {
        ctx.beginPath();
        ctx.ellipse(250, ty, 6.2, 2.2, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(28, 39, 30, 0.55)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.restore();

      // 5c. Primary Left Lung 3D Volumetric Body
      const leftLungGrad = ctx.createRadialGradient(162, 184, 14, 174, 248, 155);
      leftLungGrad.addColorStop(0, "rgba(250, 240, 225, 0.52)");
      leftLungGrad.addColorStop(0.32, gradCamMode ? "rgba(189, 68, 68, 0.62)" : "rgba(115, 151, 106, 0.58)");
      leftLungGrad.addColorStop(0.68, "rgba(115, 151, 106, 0.48)");
      leftLungGrad.addColorStop(1, "rgba(42, 58, 45, 0.75)");

      drawLeftLungPath(ctx, 0, 0);
      ctx.fillStyle = leftLungGrad;
      ctx.fill();

      // 5d. Primary Right Lung 3D Volumetric Body
      const rightLungGrad = ctx.createRadialGradient(324, 184, 14, 326, 248, 155);
      rightLungGrad.addColorStop(0, "rgba(250, 240, 225, 0.48)");
      rightLungGrad.addColorStop(0.35, gradCamMode ? "rgba(189, 68, 68, 0.72)" : "rgba(103, 126, 97, 0.62)");
      rightLungGrad.addColorStop(0.7, "rgba(189, 68, 68, 0.46)");
      rightLungGrad.addColorStop(1, "rgba(42, 58, 45, 0.78)");

      drawRightLungPath(ctx, 0, 0);
      ctx.fillStyle = rightLungGrad;
      ctx.fill();

      // 5e. Internal 3D Topographic Wireframe Contours & Bronchial Tree inside Lungs
      ctx.save();
      drawLeftLungPath(ctx, 0, 0);
      ctx.clip();
      for (let lat = 140; lat <= 350; lat += 28) {
        ctx.beginPath();
        ctx.ellipse(172, lat, 58, 14, -0.15, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(241, 222, 196, 0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Left bronchial branches
      ctx.strokeStyle = "rgba(241, 222, 196, 0.46)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(208, 232);
      ctx.quadraticCurveTo(182, 210, 156, 178);
      ctx.moveTo(182, 212);
      ctx.lineTo(148, 222);
      ctx.moveTo(208, 232);
      ctx.quadraticCurveTo(184, 266, 156, 312);
      ctx.moveTo(182, 272);
      ctx.lineTo(196, 324);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      drawRightLungPath(ctx, 0, 0);
      ctx.clip();
      for (let lat = 140; lat <= 350; lat += 28) {
        ctx.beginPath();
        ctx.ellipse(328, lat, 58, 14, 0.15, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(241, 222, 196, 0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Grad-CAM 3D Volumetric Hotspot Sphere inside Right Lung
      if (gradCamMode) {
        const hotSpot = ctx.createRadialGradient(324, 252, 4, 324, 252, 64);
        hotSpot.addColorStop(0, "rgba(250, 240, 225, 0.85)");
        hotSpot.addColorStop(0.28, "rgba(189, 68, 68, 0.78)");
        hotSpot.addColorStop(0.68, "rgba(189, 68, 68, 0.28)");
        hotSpot.addColorStop(1, "rgba(189, 68, 68, 0)");
        ctx.fillStyle = hotSpot;
        ctx.beginPath();
        ctx.arc(324, 252, 64, 0, Math.PI * 2);
        ctx.fill();
      }
      // Right bronchial branches
      ctx.strokeStyle = "rgba(241, 222, 196, 0.46)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(292, 232);
      ctx.quadraticCurveTo(318, 210, 344, 178);
      ctx.moveTo(318, 212);
      ctx.lineTo(352, 222);
      ctx.moveTo(292, 232);
      ctx.quadraticCurveTo(316, 266, 344, 312);
      ctx.moveTo(318, 272);
      ctx.lineTo(304, 324);
      ctx.stroke();
      ctx.restore();

      // 5f. 3D Rim Light & Glass Specular Highlights on Both Lungs
      drawLeftLungPath(ctx, 0, 0);
      ctx.strokeStyle = "rgba(241, 222, 196, 0.9)";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      drawRightLungPath(ctx, 0, 0);
      ctx.strokeStyle = "rgba(241, 222, 196, 0.9)";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Top-left glass specular crescent on Left Lung
      ctx.beginPath();
      ctx.moveTo(184, 128);
      ctx.bezierCurveTo(154, 138, 134, 184, 132, 240);
      ctx.strokeStyle = "rgba(255, 250, 242, 0.68)";
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.stroke();

      // Top-left glass specular crescent on Right Lung
      ctx.beginPath();
      ctx.moveTo(304, 128);
      ctx.bezierCurveTo(294, 148, 288, 188, 288, 232);
      ctx.strokeStyle = "rgba(255, 250, 242, 0.58)";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.stroke();

      // 6. 3D Illuminated Spherical Telemetry Nodes with Specular Highlights
      const nodes = [
        { x: 162, y: 236, main: "#BD4444", dark: "#6e2020", r: 9.5, label: "ROI-A" },
        { x: 326, y: 252, main: "#BD4444", dark: "#6e2020", r: 11.5, label: "94.2%" },
        { x: 184, y: 312, main: "#F1DEC4", dark: "#8c775c", r: 8.5, label: "L-02" },
        { x: 310, y: 308, main: "#73976A", dark: "#395233", r: 9, label: "R-04" },
      ];

      nodes.forEach((node, idx) => {
        const nodePulse = Math.sin(pulsePhase * 2.2 + idx) * 0.5 + 0.5;
        const nx = node.x + px * 5;
        const ny = node.y + py * 5;

        // 3D Drop shadow under sphere
        ctx.beginPath();
        ctx.arc(nx + 2.5, ny + 4, node.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(12, 18, 14, 0.58)";
        ctx.fill();

        // 3D Pulse ring in perspective
        ctx.beginPath();
        ctx.arc(nx, ny, node.r + 5 + nodePulse * 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(241, 222, 196, ${0.55 - nodePulse * 0.35})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // 3D Sphere radial gradient
        const sphereGrad = ctx.createRadialGradient(
          nx - node.r * 0.35,
          ny - node.r * 0.35,
          node.r * 0.12,
          nx,
          ny,
          node.r,
        );
        sphereGrad.addColorStop(0, "#FFFDF9");
        sphereGrad.addColorStop(0.35, node.main);
        sphereGrad.addColorStop(1, node.dark);

        ctx.beginPath();
        ctx.arc(nx, ny, node.r, 0, Math.PI * 2);
        ctx.fillStyle = sphereGrad;
        ctx.fill();
        ctx.strokeStyle = "rgba(250, 240, 225, 0.72)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      ctx.restore();

      // 7. 3D Volumetric Laser Tomography Plane (Perspective elliptical slice)
      if (!isReducedMotion && scanActive) {
        scanY += scanDirection * 1.65;
        if (scanY > 368) scanDirection = -1;
        if (scanY < 106) scanDirection = 1;

        const planeX = cx + px * 10;
        const planeY = scanY + py * 6;

        // Volumetric light cone trailing behind plane
        const coneGrad = ctx.createLinearGradient(0, planeY - scanDirection * 34, 0, planeY);
        coneGrad.addColorStop(0, "rgba(189, 68, 68, 0)");
        coneGrad.addColorStop(1, "rgba(189, 68, 68, 0.24)");
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.ellipse(planeX, planeY - scanDirection * 14, 152, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3D Elliptical Cross-Section Disc
        const discGrad = ctx.createRadialGradient(planeX, planeY, 12, planeX, planeY, 156);
        discGrad.addColorStop(0, "rgba(250, 240, 225, 0.42)");
        discGrad.addColorStop(0.55, "rgba(189, 68, 68, 0.32)");
        discGrad.addColorStop(0.85, "rgba(115, 151, 106, 0.22)");
        discGrad.addColorStop(1, "rgba(103, 126, 97, 0)");

        ctx.beginPath();
        ctx.ellipse(planeX, planeY, 156, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = discGrad;
        ctx.fill();

        // Glowing 3D Ring Perimeter of the Scan Plane
        ctx.beginPath();
        ctx.ellipse(planeX, planeY, 152, 16, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(250, 240, 225, 0.88)";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Bright center laser core line
        const scanGrad = ctx.createLinearGradient(planeX - 155, planeY, planeX + 155, planeY);
        scanGrad.addColorStop(0, "rgba(189, 68, 68, 0)");
        scanGrad.addColorStop(0.25, "rgba(189, 68, 68, 0.95)");
        scanGrad.addColorStop(0.5, "rgba(250, 240, 225, 1)");
        scanGrad.addColorStop(0.75, "rgba(115, 151, 106, 0.95)");
        scanGrad.addColorStop(1, "rgba(103, 126, 97, 0)");

        ctx.strokeStyle = scanGrad;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(planeX - 155, planeY);
        ctx.lineTo(planeX + 155, planeY);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [scanActive, gradCamMode, isReducedMotion]);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ perspective: "1100px" }}
      className="group relative flex items-center justify-center overflow-hidden rounded-[30px] border-2 border-[color-mix(in_srgb,var(--pd-cream)_28%,transparent)] bg-[radial-gradient(circle_at_50%_22%,#263829_0%,#151f17_58%,#0d140f_100%)] p-4 shadow-[0_24px_48px_-14px_rgba(0,0,0,0.55),0_10px_0_0_rgba(18,27,20,0.92),inset_0_2px_3px_rgba(255,255,255,0.22),inset_0_-8px_18px_rgba(0,0,0,0.65)] sm:p-6"
    >
      {/* 3D Architectural Grid & Ambient Top Specular Glare */}
      <div className="pd-grid-bg pointer-events-none absolute inset-0 opacity-75" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-4/5 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(250,240,225,0.16)_0%,transparent_70%)] blur-xl"
      />

      {/* Top 3D Extruded Badge */}
      <div className="absolute top-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-2xl border border-[rgba(255,255,255,0.45)] bg-[linear-gradient(145deg,#faf0e1_0%,#e5cfb1_100%)] px-3.5 py-1.5 text-xs font-bold text-[#1f2920] shadow-[0_10px_22px_-6px_rgba(0,0,0,0.55),0_4px_0_0_#b59d7e,inset_0_2px_2px_rgba(255,255,255,0.9)]">
        <span className="pd-icon-3d pd-icon-3d--red h-6 w-6 rounded-lg">
          <CpuIcon size={13} strokeWidth={2.2} />
        </span>
        <span className="tracking-tight">DenseNet121 + 3D Grad-CAM</span>
      </div>

      {/* Left/Start Floating 3D Depth Telemetry Pill */}
      <div className="pointer-events-none absolute top-1/2 start-3.5 z-20 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
        <div className="flex items-center gap-2 rounded-2xl border border-[rgba(250,240,225,0.22)] bg-[linear-gradient(145deg,rgba(115,151,106,0.34),rgba(28,39,30,0.88))] px-3 py-2 text-[11px] font-semibold text-[#faf0e1] shadow-[0_10px_20px_-6px_rgba(0,0,0,0.5),0_3px_0_0_rgba(18,27,20,0.95),inset_0_1px_1px_rgba(255,255,255,0.28)] backdrop-blur-md">
          <span className="pd-icon-3d pd-icon-3d--sage h-6 w-6 rounded-lg">
            <LayersIcon size={12} strokeWidth={2.2} />
          </span>
          <div className="leading-tight">
            <div className="text-[10px] opacity-75">{isAr ? "العمق الحجمي" : "3D Volume"}</div>
            <div>128 Slices</div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-[rgba(250,240,225,0.22)] bg-[linear-gradient(145deg,rgba(189,68,68,0.34),rgba(28,39,30,0.88))] px-3 py-2 text-[11px] font-semibold text-[#faf0e1] shadow-[0_10px_20px_-6px_rgba(0,0,0,0.5),0_3px_0_0_rgba(18,27,20,0.95),inset_0_1px_1px_rgba(255,255,255,0.28)] backdrop-blur-md">
          <span className="pd-icon-3d pd-icon-3d--red h-6 w-6 rounded-lg">
            <ActivityIcon size={12} strokeWidth={2.2} />
          </span>
          <div className="leading-tight">
            <div className="text-[10px] opacity-75">{isAr ? "بؤرة الانتباه" : "ROI Focus"}</div>
            <div>94.2% Conf.</div>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", maxWidth: 450, height: "auto", aspectRatio: "1/1" }}
        className="relative z-10 transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        aria-label={
          isAr
            ? "تصور ثلاثي الأبعاد تفاعلي لفحص الرئتين وتحليل الأشعة"
            : "Interactive 3D volumetric bilateral lung scanner visualization"
        }
      />

      {/* Bottom Status 3D Pill */}
      <div className="absolute bottom-4 start-4 z-20 flex items-center gap-2.5 rounded-2xl border border-[rgba(255,255,255,0.45)] bg-[linear-gradient(145deg,#faf0e1_0%,#e5cfb1_100%)] px-3.5 py-1.5 text-xs font-bold text-[#1f2920] shadow-[0_10px_20px_-6px_rgba(0,0,0,0.55),0_4px_0_0_#b59d7e,inset_0_2px_2px_rgba(255,255,255,0.9)]">
        <span className="pd-icon-3d pd-icon-3d--sage h-6 w-6 rounded-lg">
          <SparklesIcon size={12} strokeWidth={2.2} />
        </span>
        <span>{isAr ? "نظام الفرز السريري نشط" : "Clinical Screening Active"}</span>
      </div>

      {/* Bottom 3D Interactive Push-Buttons */}
      <div className="absolute bottom-4 end-4 z-20 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setGradCamMode((v) => !v)}
          className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all duration-150 active:translate-y-0.5 ${
            gradCamMode
              ? "border border-[rgba(255,255,255,0.32)] bg-[linear-gradient(145deg,#d85a5a_0%,#bd4444_55%,#8f2c2c_100%)] text-[#faf0e1] shadow-[0_10px_18px_-5px_rgba(189,68,68,0.6),0_4px_0_0_#6b1f1f,inset_0_2px_2px_rgba(255,255,255,0.42)]"
              : "border border-[rgba(250,240,225,0.28)] bg-[linear-gradient(145deg,#334636_0%,#1e2b20_100%)] text-[#faf0e1]/85 shadow-[0_8px_16px_-4px_rgba(0,0,0,0.5),0_4px_0_0_#101812,inset_0_1px_1px_rgba(255,255,255,0.2)]"
          }`}
        >
          <span>Grad-CAM</span>
        </button>
        <button
          type="button"
          onClick={() => setScanActive((v) => !v)}
          className="flex items-center gap-1.5 rounded-2xl border border-[rgba(255,255,255,0.45)] bg-[linear-gradient(145deg,#faf0e1_0%,#e5cfb1_100%)] px-3.5 py-1.5 text-xs font-bold text-[#1f2920] shadow-[0_10px_18px_-5px_rgba(0,0,0,0.55),0_4px_0_0_#b59d7e,inset_0_2px_2px_rgba(255,255,255,0.9)] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5"
        >
          {scanActive ? <PauseIcon size={12} strokeWidth={2.4} /> : <PlayIcon size={12} strokeWidth={2.4} />}
          <span>
            {scanActive
              ? isAr
                ? "إيقاف المسح"
                : "Pause Scan"
              : isAr
                ? "تشغيل المسح"
                : "Resume Scan"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default MedicalScannerHero;

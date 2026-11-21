"use client";

import { useMemo } from "react";

export default function FuturisticStars() {
  const scene = useMemo(() => {
    const stars = Array.from({ length: 120 }).map((_, idx) => ({
      cx: (idx * 73) % 1440,
      cy: (idx * 211) % 800,
      r: 0.4 + (idx % 5) * 0.3,
      opacity: 0.25 + (idx % 7) * 0.08,
    }));

    const buildings = Array.from({ length: 8 }).map((_, idx) => ({
      x: 50 + ((idx * 150) % 1340),
      y: 620 + (idx % 4) * 20,
      width: 60 + (idx % 5) * 12,
      height: 45 + (idx % 6) * 8,
      color: [
        "var(--color-secondary-500)",
        "var(--color-accent-500)",
        "var(--color-primary-500)",
      ][idx % 3],
      opacity: 0.12 + (idx % 3) * 0.04,
    }));

    return { stars, buildings };
  }, []);

  return (
    // aria-hidden="true" hides this decorative element from screen readers
    <div className="absolute inset-0 -z-20" aria-hidden="true">
      <svg
        className="w-full h-full"
        viewBox="0 0 1440 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* This gradient is now used for the stars to give them a soft glow */}
          <radialGradient
            id="starGlow"
            cx="50%"
            cy="50%"
            r="80%"
            fx="50%"
            fy="50%"
            gradientTransform="rotate(0)"
          >
            <stop
              offset="0%"
              stopColor="var(--color-secondary-500)"
              stopOpacity="0.2"
            />
            <stop
              offset="100%"
              stopColor="var(--color-accent-500)"
              stopOpacity="0.05"
            />
          </radialGradient>
          <linearGradient id="cityGlow" x1="0" y1="1" x2="0" y2="0">
            <stop
              offset="0%"
              stopColor="var(--color-accent-500)"
              stopOpacity="0.7"
            />
            <stop
              offset="100%"
              stopColor="var(--color-secondary-500)"
              stopOpacity="0.1"
            />
          </linearGradient>
        </defs>

        {/* Dynamically rendered star field using the gradient */}
        {scene.stars.map((star, i) => (
          <circle
            key={i}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            fill="url(#starGlow)"
            opacity={star.opacity}
          />
        ))}

        {/* Cyber cityscape silhouette with a glowing background and dynamic buildings */}
        <g>
          <rect x="0" y="700" width="1440" height="100" fill="url(#cityGlow)" />
          {scene.buildings.map((building, i) => (
            <rect
              key={`b-${i}`} // Use a unique key for buildings
              x={building.x}
              y={building.y}
              width={building.width}
              height={building.height}
              fill={building.color}
              opacity={building.opacity}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

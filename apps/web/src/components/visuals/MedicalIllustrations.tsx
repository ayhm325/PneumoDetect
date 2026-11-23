import { motion, useReducedMotion } from "framer-motion";

/**
 * Subtle atmospheric backdrop with organic floating orbs & scientific coordinate lines.
 * Purely transform/opacity based and respects prefers-reduced-motion.
 */
export function AmbientBackdrop({ className = "" }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Top-start organic orb */}
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 14, 0], y: [0, -10, 0], scale: [1, 1.04, 1] }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-28 -start-24 h-80 w-80 rounded-full bg-[var(--pd-sage)]/12 blur-3xl"
      />
      {/* Bottom-end organic orb */}
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -16, 0], y: [0, 12, 0], scale: [1, 1.06, 1] }
        }
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -end-24 h-96 w-96 rounded-full bg-[var(--pd-red)]/10 blur-3xl"
      />
    </div>
  );
}

/**
 * Original bilateral lung + neural attention SVG illustration.
 * Uses only currentColor and the 4 brand CSS variables.
 */
export function LungNetworkSvg({
  activeZone = 1,
  className = "",
}: {
  activeZone?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 360 300"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <radialGradient id="pd-lung-3d-left" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FAF0E1" stopOpacity="0.62" />
          <stop offset="45%" stopColor="#73976A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#263628" stopOpacity="0.82" />
        </radialGradient>
        <radialGradient id="pd-lung-3d-right" cx="65%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FAF0E1" stopOpacity="0.58" />
          <stop offset="45%" stopColor="#BD4444" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#263628" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id="pd-node-3d-red" cx="32%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FFFDF9" />
          <stop offset="40%" stopColor="#BD4444" />
          <stop offset="100%" stopColor="#6B1F1F" />
        </radialGradient>
        <radialGradient id="pd-node-3d-sage" cx="32%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FFFDF9" />
          <stop offset="40%" stopColor="#73976A" />
          <stop offset="100%" stopColor="#32472D" />
        </radialGradient>
        <radialGradient id="pd-node-3d-cream" cx="32%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#F1DEC4" />
          <stop offset="100%" stopColor="#8C775C" />
        </radialGradient>
      </defs>

      {/* 3D Perspective Pedestal Rings */}
      <ellipse
        cx="180"
        cy="268"
        rx="118"
        ry="18"
        fill="var(--pd-red)"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1.2"
      />
      <ellipse
        cx="180"
        cy="268"
        rx="82"
        ry="11"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeDasharray="5 5"
      />

      {/* Orbital 3D Coordinate Rings */}
      <circle
        cx="180"
        cy="148"
        r="124"
        stroke="currentColor"
        strokeOpacity="0.16"
        strokeDasharray="4 6"
      />
      <ellipse
        cx="180"
        cy="148"
        rx="126"
        ry="52"
        transform="rotate(-24 180 148)"
        stroke="currentColor"
        strokeOpacity="0.18"
      />
      <ellipse
        cx="180"
        cy="148"
        rx="126"
        ry="52"
        transform="rotate(24 180 148)"
        stroke="currentColor"
        strokeOpacity="0.14"
      />

      {/* 3D Depth Extrusion Back Slices for Lungs */}
      <path
        d="M157 98 C125 98 87 124 81 174 C77 210 87 240 113 244 C137 248 159 234 161 206 V110 C161 102 160 98 157 98 Z"
        fill="#162018"
        fillOpacity="0.55"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1.5"
      />
      <path
        d="M203 98 C235 98 273 124 279 174 C283 210 273 240 247 244 C223 248 201 234 199 206 V110 C199 102 200 98 203 98 Z"
        fill="#162018"
        fillOpacity="0.55"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1.5"
      />

      {/* 3D Cylindrical Trachea & Bronchi */}
      <path
        d="M180 30 V96 M180 96 C162 110 144 122 128 144 M180 96 C198 110 216 122 232 144"
        stroke="#162018"
        strokeWidth="8"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />
      <path
        d="M180 30 V96 M180 96 C162 110 144 122 128 144 M180 96 C198 110 216 122 232 144"
        stroke="currentColor"
        strokeWidth="4.8"
        strokeLinecap="round"
        strokeOpacity="0.88"
      />
      <path
        d="M179 32 V95 M179 95 C161 109 143 121 127 143"
        stroke="#FFFDF9"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />

      {/* Left Lung 3D Volumetric Shell */}
      <path
        d="M162 92 C130 92 92 118 86 168 C82 204 92 234 118 238 C142 242 164 228 166 200 V104 C166 96 165 92 162 92 Z"
        fill="url(#pd-lung-3d-left)"
        stroke="#FAF0E1"
        strokeWidth="2.2"
        strokeOpacity="0.92"
      />
      {/* Left Lung Specular Highlight Crescent */}
      <path
        d="M154 102 C130 108 102 132 96 174"
        stroke="#FFFDF9"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />

      {/* Right Lung 3D Volumetric Shell */}
      <path
        d="M198 92 C230 92 268 118 274 168 C278 204 268 234 242 238 C218 242 196 228 194 200 V104 C194 96 195 92 198 92 Z"
        fill="url(#pd-lung-3d-right)"
        stroke="#FAF0E1"
        strokeWidth="2.2"
        strokeOpacity="0.92"
      />
      {/* Right Lung Specular Highlight Crescent */}
      <path
        d="M206 102 C202 122 200 152 200 184"
        stroke="#FFFDF9"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />

      {/* Internal 3D Topographic Rib Latitudes */}
      <ellipse cx="128" cy="148" rx="34" ry="8" stroke="#FAF0E1" strokeOpacity="0.22" />
      <ellipse cx="126" cy="182" rx="38" ry="9" stroke="#FAF0E1" strokeOpacity="0.22" />
      <ellipse cx="232" cy="148" rx="34" ry="8" stroke="#FAF0E1" strokeOpacity="0.22" />
      <ellipse cx="234" cy="182" rx="38" ry="9" stroke="#FAF0E1" strokeOpacity="0.22" />

      {/* Bronchial neural branches */}
      <path
        d="M128 144 L110 170 M128 144 L142 184 M232 144 L250 170 M232 144 L218 184"
        stroke="#FAF0E1"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity="0.68"
      />

      {/* Grad-CAM 3D Volumetric Attention Sphere */}
      <motion.circle
        cx={activeZone % 2 === 0 ? 124 : 234}
        cy={activeZone < 2 ? 170 : 198}
        r="30"
        fill="var(--pd-red)"
        fillOpacity="0.34"
        stroke="#FAF0E1"
        strokeWidth="1.8"
        animate={
          reduceMotion
            ? undefined
            : { scale: [0.94, 1.09, 0.94], opacity: [0.75, 1, 0.75] }
        }
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle
        cx={activeZone % 2 === 0 ? 124 : 234}
        cy={activeZone < 2 ? 170 : 198}
        r="8"
        fill="url(#pd-node-3d-red)"
        stroke="#FAF0E1"
        strokeWidth="1.2"
      />

      {/* 3D Spherical Telemetry Nodes */}
      <circle cx="110" cy="170" r="6" fill="url(#pd-node-3d-cream)" />
      <circle cx="142" cy="184" r="6" fill="url(#pd-node-3d-sage)" />
      <circle cx="250" cy="170" r="6" fill="url(#pd-node-3d-cream)" />
      <circle cx="218" cy="184" r="6" fill="url(#pd-node-3d-sage)" />
    </svg>
  );
}

/**
 * Connected 4-stage AI pipeline diagram for the interactive workflow showcase.
 */
export function NeuralPipelineSvg({
  activeStep = 0,
  className = "",
}: {
  activeStep?: number;
  className?: string;
}) {
  const nodes = [56, 138, 222, 304];

  return (
    <svg viewBox="0 0 360 96" fill="none" aria-hidden="true" className={className}>
      {/* Base spine */}
      <line
        x1="56"
        y1="48"
        x2="304"
        y2="48"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="2"
        strokeDasharray="5 5"
      />
      {/* Active progress path */}
      <line
        x1="56"
        y1="48"
        x2={nodes[Math.min(Math.max(activeStep, 0), 3)]}
        y2="48"
        stroke="var(--pd-red)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {nodes.map((x, idx) => {
        const isActive = idx === activeStep;
        const isDone = idx < activeStep;
        return (
          <g key={x}>
            <circle
              cx={x}
              cy="48"
              r={isActive ? 18 : 13}
              fill={
                isActive
                  ? "var(--pd-red)"
                  : isDone
                    ? "var(--pd-sage)"
                    : "var(--pd-neutral-surface)"
              }
              stroke="currentColor"
              strokeOpacity={isActive ? 0.9 : 0.35}
              strokeWidth="1.5"
            />
            <text
              x={x}
              y="52"
              textAnchor="middle"
              fill={isActive || isDone ? "#FAF0E1" : "currentColor"}
              fontSize="11"
              fontWeight="600"
            >
              0{idx + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

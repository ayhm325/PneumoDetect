"use client";

// No default React import needed with modern JSX

export default function AnimatedBackground({ className = "" }) {
  return (
    <div
      className={`animated-background-component absolute inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 800"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="g1" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#d9f7e6" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="g2" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#c7f9ff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#a5f3fc" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#d9f7e6" stopOpacity="0.7" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="30" result="blurred" />
            <feMerge>
              <feMergeNode in="blurred" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft blur for smaller shapes */}
          <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="20" result="b" />
            <feBlend in="SourceGraphic" in2="b" />
          </filter>
        </defs>

        {/* Big glowing blob 1 */}
        <g opacity="0.9">
          <circle cx="300" cy="220" r="260" fill="url(#g1)" filter="url(#glow)">
            <animate
              attributeName="cx"
              dur="25s"
              repeatCount="indefinite"
              values="300;360;260;300"
            />
            <animate
              attributeName="cy"
              dur="30s"
              repeatCount="indefinite"
              values="220;200;240;220"
            />
            <animate
              attributeName="r"
              dur="40s"
              repeatCount="indefinite"
              values="260;280;240;260"
            />
          </circle>
        </g>

        {/* Big blob 2 */}
        <g opacity="0.8">
          <ellipse
            cx="1100"
            cy="420"
            rx="320"
            ry="220"
            fill="url(#g2)"
            filter="url(#glow)"
            transform="rotate(-12 1100 420)"
          >
            <animate
              attributeName="cx"
              dur="28s"
              repeatCount="indefinite"
              values="1100;1040;1160;1100"
            />
            <animate
              attributeName="cy"
              dur="32s"
              repeatCount="indefinite"
              values="420;390;450;420"
            />
          </ellipse>
        </g>

        {/* Small floating circles */}
        <g fill="#dffaf0" opacity="0.6">
          {Array.from({ length: 6 }, (_, i) => (
            <circle
              key={i}
              cx={200 + i * 180}
              cy={100 + i * 90}
              r={30 + i * 5}
              filter="url(#blur)"
            >
              <animate
                attributeName="cx"
                dur={`${20 + i * 3}s`}
                repeatCount="indefinite"
                values={`${200 + i * 180}; ${220 + i * 180}; ${180 + i * 180}; ${200 + i * 180}`}
              />
              <animate
                attributeName="cy"
                dur={`${18 + i * 2}s`}
                repeatCount="indefinite"
                values={`${100 + i * 90}; ${120 + i * 90}; ${80 + i * 90}; ${100 + i * 90}`}
              />
            </circle>
          ))}
        </g>

        {/* Floating rounded squares */}
        <g fill="#dffaf0" opacity="0.85">
          <rect x="70" y="560" width="120" height="120" rx="24" ry="24">
            <animateTransform
              attributeName="transform"
              type="translate"
              dur="18s"
              repeatCount="indefinite"
              values="0 0; 8 -12; -8 6; 0 0"
            />
            <animate
              attributeName="opacity"
              dur="9s"
              repeatCount="indefinite"
              values="0.9;0.6;0.85;0.9"
            />
          </rect>

          <rect x="1180" y="100" width="90" height="90" rx="18" ry="18">
            <animateTransform
              attributeName="transform"
              type="translate"
              dur="20s"
              repeatCount="indefinite"
              values="0 0; -6 10; 6 -6; 0 0"
            />
            <animate
              attributeName="opacity"
              dur="11s"
              repeatCount="indefinite"
              values="0.8;0.55;0.85;0.8"
            />
          </rect>

          <rect x="760" y="620" width="70" height="70" rx="14" ry="14">
            <animateTransform
              attributeName="transform"
              type="translate"
              dur="24s"
              repeatCount="indefinite"
              values="0 0; 10 -8; -6 12; 0 0"
            />
            <animate
              attributeName="opacity"
              dur="12s"
              repeatCount="indefinite"
              values="0.85;0.6;0.9;0.85"
            />
          </rect>
        </g>

        {/* Subtle diagonal lines */}
        <g stroke="#e6fff6" strokeWidth="1" opacity="0.25">
          {Array.from({ length: 12 }, (_, i) => (
            <line
              key={i}
              x1={-200 + i * 160}
              y1={-80}
              x2={200 + i * 160}
              y2={980}
            />
          ))}
          <animateTransform
            attributeName="transform"
            type="translate"
            dur="60s"
            repeatCount="indefinite"
            values="0 0; -40 20; 0 0"
          />
        </g>
      </svg>

      <style>{`
        .animated-background-component { pointer-events: none; }
        .animated-background-component svg { display: block; width: 100%; height: 100%; }
        @media (prefers-reduced-motion: reduce) {
          .animated-background-component svg * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

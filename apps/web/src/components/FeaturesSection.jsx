"use client";
import Image from "@/lib/compat/Image";
import { useMemo } from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function FeaturesSection() {
  const t = useTranslations("features");
  // ...existing code...
  // Use t("key") for all feature text, remove any hardcoded text
  const featureCopy = {
    title: t("title"),
    subtitle: t("subtitle"),
    items: [
      {
        icon: "/icons/ai.svg",
        title: t("item1.title"),
        desc: t("item1.desc"),
      },
      {
        icon: "/icons/xray.svg",
        title: t("item2.title"),
        desc: t("item2.desc"),
      },
      {
        icon: "/icons/result.svg",
        title: t("item3.title"),
        desc: t("item3.desc"),
      },
    ],
    extras: [
      { icon: "🔒", title: t("extra1.title"), desc: t("extra1.desc") },
      { icon: "⚡", title: t("extra2.title"), desc: t("extra2.desc") },
      { icon: "📊", title: t("extra3.title"), desc: t("extra3.desc") },
      { icon: "🌐", title: t("extra4.title"), desc: t("extra4.desc") },
    ],
  };
  const particles = useMemo(() => {
    const colors = [
      "color-mix(in srgb, var(--ui-ring) 60%, transparent)",
      "color-mix(in srgb, var(--ui-warning) 60%, transparent)",
      "color-mix(in srgb, var(--ui-info) 60%, transparent)",
    ];

    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      width: 4 + (i % 4) * 1.5,
      height: 4 + ((i + 1) % 4) * 1.2,
      left: (i * 13 + 7) % 100,
      top: (i * 17 + 11) % 100,
      background: colors[i % 3],
      animationDuration: 15 + (i % 5) * 1.5,
      animationDelay: (i % 4) * 0.6,
    }));
  }, []);

  return (
    <section className="relative w-full py-20 sm:py-24 bg-(--ui-surface) text-(--ui-foreground) overflow-hidden">
      {/* Holographic Animated Background */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Moving Holographic Gradients */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute top-0 left-0 w-125 h-125 bg-(--ui-ring)/15 rounded-full blur-3xl animate-float"
            style={{ animationDuration: "20s" }}
          />
          <div
            className="absolute top-1/4 right-0 w-150 h-150 bg-(--ui-info)/15 rounded-full blur-3xl animate-float"
            style={{ animationDuration: "25s", animationDelay: "2s" }}
          />
          <div
            className="absolute bottom-0 left-1/3 w-137.5 h-137.5 bg-(--ui-success)/15 rounded-full blur-3xl animate-float"
            style={{ animationDuration: "22s", animationDelay: "4s" }}
          />
        </div>

        {/* Holographic Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
            linear-gradient(90deg, color-mix(in srgb, var(--ui-ring) 14%, transparent) 1px, transparent 1px),
            linear-gradient(0deg, color-mix(in srgb, var(--ui-info) 14%, transparent) 1px, transparent 1px)
          `,
            backgroundSize: "80px 80px",
            animation: "gridMove 30s linear infinite",
          }}
        />

        {/* Radial Glow Effects */}
        <div className="absolute inset-0 opacity-40">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              radial-gradient(circle at 25% 25%, color-mix(in srgb, var(--ui-ring) 18%, transparent) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, color-mix(in srgb, var(--ui-info) 18%, transparent) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--ui-warning) 14%, transparent) 0%, transparent 60%)
            `,
            }}
          />
        </div>

        {/* Floating Holographic Particles */}
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full blur-sm animate-pulse"
              style={{
                width: `${particle.width}px`,
                height: `${particle.height}px`,
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                background: particle.background,
                animation: `floatParticle ${particle.animationDuration}s ease-in-out infinite`,
                animationDelay: `${particle.animationDelay}s`,
              }}
            />
          ))}
        </div>

        {/* Animated Holographic Lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="holoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "var(--ui-ring)", stopOpacity: 0.8 }}
              >
                <animate
                  attributeName="offset"
                  values="0;1;0"
                  dur="10s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop
                offset="50%"
                style={{ stopColor: "var(--ui-warning)", stopOpacity: 0.5 }}
              >
                <animate
                  attributeName="offset"
                  values="0.5;1;0.5"
                  dur="10s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop
                offset="100%"
                style={{ stopColor: "var(--ui-info)", stopOpacity: 0.8 }}
              >
                <animate
                  attributeName="offset"
                  values="1;0;1"
                  dur="10s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
          </defs>
          <path
            d="M0,50 Q250,100 500,50 T1000,50"
            stroke="url(#holoGrad1)"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          >
            <animate
              attributeName="d"
              values="M0,50 Q250,100 500,50 T1000,50;M0,100 Q250,50 500,100 T1000,100;M0,50 Q250,100 500,50 T1000,50"
              dur="15s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M0,150 Q250,200 500,150 T1000,150"
            stroke="url(#holoGrad1)"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
          >
            <animate
              attributeName="d"
              values="M0,150 Q250,200 500,150 T1000,150;M0,200 Q250,150 500,200 T1000,200;M0,150 Q250,200 500,150 T1000,150"
              dur="18s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fadeIn">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
            <span className="brand-gradient-text">{featureCopy.title}</span>
          </h2>
          <p className="text-lg text-(--ui-muted-foreground) max-w-2xl mx-auto">
            {featureCopy.subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featureCopy.items.map((feature, i) => (
            <div
              key={i}
              className="group relative animate-fadeIn"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Glow Effect */}
              <div className="absolute -inset-1 brand-gradient rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />

              {/* Card */}
              <div className="relative h-full p-8 card-glass rounded-3xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                {/* Icon Container */}
                <div className="relative mb-6 inline-flex">
                  <div className="absolute inset-0 brand-gradient rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
                  <div className="relative w-20 h-20 flex items-center justify-center bg-(--ui-surface-2) border border-(--ui-border) rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Image
                      src={feature.icon}
                      alt={feature.title}
                      width={48}
                      height={48}
                      className="drop-shadow-lg"
                    />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold mb-3 brand-gradient-text">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-(--ui-muted-foreground) text-base leading-relaxed">
                  {feature.desc}
                </p>

                {/* Decorative Element */}
                <div className="absolute bottom-0 left-0 w-full h-1 brand-gradient rounded-b-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features List */}
        <div
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn"
          style={{ animationDelay: "0.4s" }}
        >
          {featureCopy.extras.map((item, i) => (
            <div
              key={i}
              className="group flex items-start gap-4 p-6 card-glass rounded-2xl hover:shadow-lg transition-all duration-300"
            >
              <div className="text-4xl shrink-0 transform group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-(--ui-foreground) mb-1">
                  {item.title}
                </h4>
                <p className="text-sm text-(--ui-muted-foreground)">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
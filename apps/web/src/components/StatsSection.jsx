"use client";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function StatsSection() {
  const t = useTranslations("content"); // ??????? ????? next-intl ???????
  const [isVisible, setIsVisible] = useState(false); // ?????? ??? ???? ??? section ????? ???????
  const [floaters, setFloaters] = useState([]); // ????? ???????? ??????? ?? ???????
  const sectionRef = useRef(null); // ???? DOM ??? section ??????? ?????

  // ?????? ???? ??? section ??? ??????
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true); // ??? ???? ????? ???? ??????? ??????
        }
      },
      { threshold: 0.2 }, // ???? ???? ?????? ??? ?????? ??? ???????
    );

    const currentRef = sectionRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  // ????? ????? ???????? ??????? ??? ???????
  useEffect(() => {
    setFloaters(
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        width: Math.random() * 100 + 20, // ??? ??????
        height: Math.random() * 100 + 20, // ?????? ??????
        left: Math.random() * 100, // ???? ???? ?????? %
        top: Math.random() * 100, // ???? ????? ?????? %
        delay: Math.random() * 5, // ????? ????? ??????
        duration: Math.random() * 10 + 10, // ??? ??????
      })),
    );
  }, []);

  const stats = (t.raw && t.raw("content.stats.cards")) || []; // ?????? ???????? ?????????

  // ???? ????? ?????? ??????? ???????? ??? ???? ?????
  const AnimatedNumber = ({ target = 0, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;

      const duration = 2000; // ??? ??????? ??????? ?????
      const steps = 60; // ??? ???????
      const increment = target / steps; // ????? ??????? ?? ?? ????
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [target]);

    // ??? ??? ????? 24 ?????? ?????? (suffix == "/7")? ????? ???? ????? ?????
    if (target === 24 && suffix === "/7") {
      return (
        <span>
          24/7
        </span>
      );
    }

    return (
      <span>
        {target < 100 ? (count / 1).toFixed(1) : count.toLocaleString()}
        {suffix}
      </span>
    );
  };

  return (
    <section
      ref={sectionRef} // ??? ?????? ??????? ???? ?????
      className="relative w-full py-20 sm:py-24 bg-linear-to-br from-(--color-bright-300) via-(--color-primary-500) to-(--color-dark-300) overflow-hidden"
    >
      {/* ??? ??????? ???????? */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--color-background) 20%, transparent) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, color-mix(in srgb, var(--color-background) 15%, transparent) 0%, transparent 50%)
          `,
          }}
        />
      </div>

      {/* ???????? ??????? */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floaters.map((f) => (
          <div
            key={f.id}
            className="absolute rounded-full bg-(--color-neutral)/10 animate-float"
            style={{
              width: `${f.width}px`,
              height: `${f.height}px`,
              left: `${f.left}%`,
              top: `${f.top}%`,
              animationDelay: `${f.delay}s`,
              animationDuration: `${f.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ??? ????? */}
        <div className="text-center mb-16 animate-fadeIn">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            {t("content.stats.title")}
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            {t("content.stats.subtitle")}
          </p>
        </div>

        {/* ???? ?????????? */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`group animate-fadeIn ${isVisible ? "opacity-100" : "opacity-0"}`}
              style={{
                animationDelay: `${i * 0.1}s`,
                transition: "opacity 0.5s ease-out",
              }}
            >
              {/* ????? ??????? */}
              <div className="relative h-full p-8 card-glass rounded-3xl border border-(--ui-border) hover:bg-(--ui-surface-2)/40 shadow-2xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-300">
                {/* ?????? ??????? */}
                <div className="text-5xl mb-4 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                  {stat.icon}
                </div>

                {/* ????? ??????? */}
                <div className="text-4xl sm:text-5xl font-black text-white mb-2">
                  {isVisible ? (
                    <AnimatedNumber target={stat.number} suffix={stat.suffix} />
                  ) : (
                    `0${stat.suffix}`
                  )}
                </div>

                {/* ????? ??????? */}
                <div className="text-xl font-bold text-white mb-2">
                  {stat.label}
                </div>

                {/* ??? ??????? */}
                <div className="text-sm text-white/80">{stat.description}</div>

                {/* ?? ????? ???? ??????? */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-(--ui-border) opacity-60 rounded-b-3xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </div>
            </div>
          ))}
        </div>

        {/* ???? ??????? ?? ???? ????? */}
        <div
          className="mt-16 text-center animate-fadeIn"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 p-8 card-glass rounded-3xl border border-(--ui-border) shadow-2xl">
            <div className="text-6xl">??</div>
            <div className="text-center sm:text-right">
              <div className="text-2xl font-black text-white mb-2">
                {t("content.stats.ctaTitle")}
              </div>
              <div className="text-white/90">
                {t("content.stats.ctaSubtitle")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";
import { useState } from "react";
import Image from "@/lib/compat/Image";
import { useTranslations } from "@/lib/compat/intl";

export default function TestimonialsSection() {
  const t = useTranslations("testimonialssection");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  const { items: testimonials = [], badges = [] } = t.raw("testimonials");
  const [activeIndex, setActiveIndex] = useState(0);
  const count = testimonials.length;
  const current = testimonials[activeIndex] || {};

  const nextTestimonial = () => {
    if (!count) return;
    setActiveIndex((prev) => (prev + 1) % count);
  };

  const prevTestimonial = () => {
    if (!count) return;
    setActiveIndex((prev) => (prev - 1 + count) % count);
  };

  return (
    <section className="relative w-full py-20 sm:py-24 bg-(--ui-surface) text-(--ui-foreground) overflow-hidden testimonials-light-bg">
      {/* Background Pattern: soft colored blotches */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 18% 28%, color-mix(in srgb, var(--color-bright-500) 46%, transparent) 0%, transparent 40%),
              radial-gradient(circle at 82% 72%, color-mix(in srgb, var(--color-dark-500) 40%, transparent) 0%, transparent 44%),
              radial-gradient(circle at 50% 12%, color-mix(in srgb, var(--color-accent-300, var(--color-bright-200)) 34%, transparent) 0%, transparent 50%)
            `,
            backgroundRepeat: "no-repeat",
            backgroundSize: "60% 60%, 50% 50%, 80% 36%",
            filter: "blur(22px)",
            opacity: 0.26,
            mixBlendMode: "soft-light",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fadeIn">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
            <span className="brand-gradient-text">
              {t("testimonials.title")}
            </span>
          </h2>
          <p className="text-lg text-(--ui-muted-foreground) max-w-2xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial Card */}
          <div
            className="relative p-8 sm:p-12 card-glass rounded-3xl border-2 border-(--ui-border) shadow-2xl"
            style={{
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.09), 0 0 60px color-mix(in srgb, var(--color-bright-500) 36%, transparent)",
              borderColor:
                "color-mix(in srgb, var(--color-bright-500) 40%, var(--ui-border))",
            }}
          >
            {/* Quote Icon */}
            <div className="absolute top-6 right-6 text-6xl text-(--ui-warning)/20">
              &ldquo;
            </div>

            {/* Profile */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-br from-(--color-bright-500) to-(--color-dark-500) rounded-full blur-lg opacity-40" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-(--ui-surface) border border-(--ui-border) rounded-full flex items-center justify-center shadow-xl">
                  <Image
                    src={current.image || "/icons/ai.svg"}
                    alt={current.name || t("aria.imageAltFallback")}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-(--ui-foreground)">
                  {current.name || placeholder}
                </h3>
                <p className="text-(--ui-muted-foreground)">
                  {current.role || placeholder}
                </p>
                {/* Rating Stars */}
                <div className="flex gap-1 mt-1">
                  {[...Array(current.rating || 0)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-(--ui-warning)"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            {/* Testimonial Text */}
            <p className="text-lg sm:text-xl text-(--ui-foreground) leading-relaxed mb-6 relative z-10">
              {current.text || placeholder}
            </p>

            {/* Navigation Arrows */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={prevTestimonial}
                className="p-3 bg-(--ui-surface) border border-(--ui-border) rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 hover:bg-(--ui-surface-2)/60"
                aria-label={t("aria.previous")}
              >
                <svg
                  className="w-6 h-6 text-(--ui-warning)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Dots Indicator */}
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? "bg-linear-to-r from-(--color-bright-500) to-(--color-dark-500) w-8"
                        : "bg-(--ui-border)"
                    }`}
                    aria-label={t("aria.goTo", { index: i + 1 })}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="p-3 bg-(--ui-surface) border border-(--ui-border) rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 hover:bg-(--ui-surface-2)/60"
                aria-label={t("aria.next")}
              >
                <svg
                  className="w-6 h-6 text-(--ui-warning)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Thumbnail Grid Below */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {testimonials.map((testimonial, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`group p-4 rounded-2xl transition-all duration-300 ${
                  i === activeIndex
                    ? "bg-(--ui-surface-2) border-2 border-(--ui-border-strong) shadow-lg scale-105"
                    : "bg-(--ui-surface) border border-(--ui-border) hover:shadow-md hover:scale-105"
                }`}
                style={
                  i === activeIndex
                    ? {
                        boxShadow:
                          "0 12px 36px color-mix(in srgb, var(--color-bright-500) 36%, rgba(0,0,0,0.12))",
                      }
                    : undefined
                }
              >
                <div className="w-12 h-12 mx-auto mb-2 bg-(--ui-surface) border border-(--ui-border) rounded-full flex items-center justify-center shadow-md">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={32}
                    height={32}
                  />
                </div>
                <div className="text-xs font-semibold text-(--ui-foreground) text-center truncate">
                  {testimonial.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-60">
          {badges.map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-(--ui-muted-foreground)"
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="font-semibold">{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

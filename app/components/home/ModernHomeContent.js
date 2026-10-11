"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Alert, Button, Card } from "../../../src/components/ui";

function withLocalePath(locale, path) {
  const base = path.startsWith("/") ? path : `/${path}`;
  if (base.startsWith("/en") || base.startsWith("/ar")) return base;
  return `/${locale}${base === "/" ? "" : base}`;
}

export default function ModernHomeContent() {
  const locale = useLocale();
  const hero = useTranslations("hero");
  const features = useTranslations("features");
  const workflow = useTranslations("workflowsection");
  const content = useTranslations("content");
  const testimonialsT = useTranslations("testimonialssection");

  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const heroStats = useMemo(
    () => [
      { value: hero("stats1"), label: hero("statsLabel1") },
      { value: hero("stats3"), label: hero("statsLabel3") },
      { value: hero("stats4"), label: hero("statsLabel4") },
    ],
    [hero],
  );

  const featureItems = useMemo(
    () => [
      { icon: "/icons/ai.svg", title: features("item1.title"), desc: features("item1.desc") },
      { icon: "/icons/xray.svg", title: features("item2.title"), desc: features("item2.desc") },
      { icon: "/icons/result.svg", title: features("item3.title"), desc: features("item3.desc") },
    ],
    [features],
  );

  const extraItems = useMemo(
    () => [
      { icon: "🔒", title: features("extra1.title"), desc: features("extra1.desc") },
      { icon: "⚡", title: features("extra2.title"), desc: features("extra2.desc") },
      { icon: "📊", title: features("extra3.title"), desc: features("extra3.desc") },
      { icon: "🌐", title: features("extra4.title"), desc: features("extra4.desc") },
    ],
    [features],
  );

  const workflowData = workflow.raw("content.workflow") || {};
  const workflowSteps = Array.isArray(workflowData.steps) ? workflowData.steps : [];

  const statsData = content.raw("content.stats") || {};
  const statsCards = Array.isArray(statsData.cards) ? statsData.cards : [];

  const testimonialData = testimonialsT.raw("testimonials") || {};
  const testimonialItems = Array.isArray(testimonialData.items) ? testimonialData.items : [];
  const testimonialBadges = Array.isArray(testimonialData.badges) ? testimonialData.badges : [];
  const currentTestimonial = testimonialItems[activeTestimonial] || null;

  function nextTestimonial() {
    if (!testimonialItems.length) return;
    setActiveTestimonial((prev) => (prev + 1) % testimonialItems.length);
  }

  function prevTestimonial() {
    if (!testimonialItems.length) return;
    setActiveTestimonial((prev) => (prev - 1 + testimonialItems.length) % testimonialItems.length);
  }

  return (
    <main className="relative space-y-6 bg-[var(--ui-surface)] px-4 pb-8 pt-6 sm:space-y-8 sm:px-6 lg:px-10">
      <section className="ui-future-panel overflow-hidden rounded-3xl border p-6 sm:p-8 lg:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Alert variant="info" className="inline-flex w-auto">
              {hero("futuristic.actions.analyzeXray")}
            </Alert>

            <div className="space-y-4">
              <h1 className="brand-gradient-text text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                {hero("content.hero.title")}
              </h1>
              <p className="text-base text-[var(--ui-muted)] sm:text-lg">{hero("content.hero.subtitle")}</p>
              <p className="max-w-2xl text-sm leading-7 text-[var(--ui-muted)] sm:text-base">{hero("content.hero.desc")}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href={withLocalePath(locale, "/signup")}>
                <Button fullWidth={false} size="lg" className="px-6">{hero("content.hero.primaryCta")}</Button>
              </Link>
              <Link href={withLocalePath(locale, "/login")}>
                <Button variant="secondary" fullWidth={false} size="lg" className="px-6">
                  {hero("content.hero.secondaryCta")}
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {heroStats.map((item, index) => (
                <Card key={`hero-stat-${index}`} size="sm" className="space-y-1">
                  <p className="text-xl font-black text-[var(--color-primary-500)]">{item.value}</p>
                  <p className="text-sm text-[var(--ui-muted)]">{item.label}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="col-span-2 overflow-hidden p-0">
              <div className="relative h-52 w-full sm:h-64">
                <Image src="/icons/hero1.jpeg" alt="Hero preview 1" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              </div>
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="relative h-32 w-full sm:h-40">
                <Image src="/icons/hero2.jpeg" alt="Hero preview 2" fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
              </div>
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="relative h-32 w-full sm:h-40">
                <Image src="/icons/hero3.jpeg" alt="Hero preview 3" fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-[var(--ui-foreground)] sm:text-3xl">{features("title")}</h2>
          <p className="text-sm text-[var(--ui-muted)] sm:text-base">{features("subtitle")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featureItems.map((item, index) => (
            <Card key={`feature-${index}`} variant="interactive" size="sm" className="space-y-4">
              <div className="ui-future-chip inline-flex h-12 w-12 items-center justify-center rounded-xl">
                <Image src={item.icon} alt={item.title} width={26} height={26} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--ui-foreground)]">{item.title}</h3>
              <p className="text-sm text-[var(--ui-muted)]">{item.desc}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {extraItems.map((item, index) => (
            <Card key={`extra-${index}`} variant="interactive" size="sm" className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden>
                {item.icon}
              </span>
              <div>
                <p className="font-semibold text-[var(--ui-foreground)]">{item.title}</p>
                <p className="text-sm text-[var(--ui-muted)]">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-[var(--ui-foreground)] sm:text-3xl">{workflowData.title}</h2>
          <p className="text-sm text-[var(--ui-muted)] sm:text-base">{workflowData.subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <Card key={`step-${index}`} variant="interactive" size="sm" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="ui-future-chip inline-flex h-12 w-12 items-center justify-center rounded-xl">
                  <Image src={step.icon} alt={step.title} width={26} height={26} />
                </div>
                <span className="rounded-full bg-[var(--ui-surface-2)] px-2 py-1 text-xs font-semibold text-[var(--ui-muted)]">0{index + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--ui-foreground)]">{step.title}</h3>
              <p className="text-sm text-[var(--ui-muted)]">{step.desc}</p>
            </Card>
          ))}
        </div>

        <Card className="flex flex-col items-center justify-between gap-4 p-5 text-center sm:flex-row sm:text-start">
          <div>
            <h3 className="text-lg font-semibold text-[var(--ui-foreground)]">{workflowData.ctaTitle}</h3>
            <p className="text-sm text-[var(--ui-muted)]">{workflowData.ctaSubtitle}</p>
          </div>
          <Link href={withLocalePath(locale, "/signup")}>
            <Button fullWidth={false} className="px-6">{hero("content.hero.primaryCta")}</Button>
          </Link>
        </Card>
      </section>

      <section className="space-y-5">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-[var(--ui-foreground)] sm:text-3xl">{statsData.title}</h2>
          <p className="text-sm text-[var(--ui-muted)] sm:text-base">{statsData.subtitle}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <Card key={`stat-${index}`} className="space-y-2 p-5">
              <p className="text-3xl" aria-hidden>
                {stat.icon}
              </p>
              <p className="text-2xl font-black text-[var(--color-primary-500)]">
                {stat.number}
                {stat.suffix}
              </p>
              <p className="font-semibold text-[var(--ui-foreground)]">{stat.label}</p>
              <p className="text-sm text-[var(--ui-muted)]">{stat.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-5 pb-2">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-[var(--ui-foreground)] sm:text-3xl">{testimonialData.title}</h2>
          <p className="text-sm text-[var(--ui-muted)] sm:text-base">{testimonialData.subtitle}</p>
        </div>

        <Card className="space-y-5 p-5 sm:p-7">
          {currentTestimonial ? (
            <>
              <div className="flex items-center gap-4">
                <div className="ui-future-chip flex h-14 w-14 items-center justify-center rounded-full">
                  <Image
                    src={currentTestimonial.image || "/icons/ai.svg"}
                    alt={currentTestimonial.name || "Testimonial"}
                    width={34}
                    height={34}
                  />
                </div>
                <div>
                  <p className="font-semibold text-[var(--ui-foreground)]">{currentTestimonial.name}</p>
                  <p className="text-sm text-[var(--ui-muted)]">{currentTestimonial.role}</p>
                </div>
              </div>

              <p className="text-sm leading-7 text-[var(--ui-foreground)] sm:text-base">{currentTestimonial.text}</p>

              <div className="flex items-center justify-between">
                <Button variant="secondary" fullWidth={false} size="sm" className="px-4" onClick={prevTestimonial}>
                  ←
                </Button>
                <div className="flex items-center gap-2">
                  {testimonialItems.map((_, idx) => (
                    <button
                      key={`dot-${idx}`}
                      type="button"
                      onClick={() => setActiveTestimonial(idx)}
                      className={`h-2.5 rounded-full transition-all ${idx === activeTestimonial ? "w-8 bg-[var(--color-primary-500)]" : "w-2.5 bg-[var(--ui-border)]"}`}
                      aria-label={`testimonial-${idx + 1}`}
                    />
                  ))}
                </div>
                <Button variant="secondary" fullWidth={false} size="sm" className="px-4" onClick={nextTestimonial}>
                  →
                </Button>
              </div>
            </>
          ) : (
            <Alert variant="info">No testimonials available</Alert>
          )}
        </Card>

        {testimonialBadges.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {testimonialBadges.map((badge, index) => (
              <Card key={`badge-${index}`} className="flex items-center gap-2 p-3">
                <span className="text-lg">{badge.icon}</span>
                <span className="text-sm font-medium text-[var(--ui-foreground)]">{badge.text}</span>
              </Card>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

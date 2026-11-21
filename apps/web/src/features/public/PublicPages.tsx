import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Button, Card } from "@/components/ui";

export function HomePage() {
  const { t: hero } = useTranslation("hero");
  const { t: features } = useTranslation("features");
  const { t: workflow } = useTranslation("workflowsection");
  const { t: content } = useTranslation("content");
  const { t: testimonialsT } = useTranslation("testimonialssection");

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

  const workflowData = (workflow("content.workflow", { returnObjects: true }) || {}) as {
    title?: string;
    subtitle?: string;
    ctaTitle?: string;
    ctaSubtitle?: string;
    steps?: Array<{ icon: string; title: string; desc: string }>;
  };
  const workflowSteps = Array.isArray(workflowData.steps) ? workflowData.steps : [];

  const statsData = (content("content.stats", { returnObjects: true }) || {}) as {
    title?: string;
    subtitle?: string;
    cards?: Array<{
      icon: string;
      number: string | number;
      suffix?: string;
      label: string;
      description: string;
    }>;
  };
  const statsCards = Array.isArray(statsData.cards) ? statsData.cards : [];

  const testimonialData = (testimonialsT("testimonials", { returnObjects: true }) || {}) as {
    title?: string;
    subtitle?: string;
    items?: Array<{ image?: string; name: string; role: string; text: string }>;
    badges?: Array<{ icon: string; text: string }>;
  };
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
    <div className="relative space-y-6 bg-[var(--ui-surface)] px-4 pb-8 pt-6 sm:space-y-8 sm:px-6 lg:px-10">
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
              <p className="text-base text-[var(--ui-muted)] sm:text-lg">
                {hero("content.hero.subtitle")}
              </p>
              <p className="max-w-2xl text-sm leading-7 text-[var(--ui-muted)] sm:text-base">
                {hero("content.hero.desc")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button fullWidth={false} size="lg" className="px-6">
                  {hero("content.hero.primaryCta")}
                </Button>
              </Link>
              <Link to="/login">
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
                <img
                  src="/icons/hero1.jpeg"
                  alt="Hero preview 1"
                  className="h-full w-full object-cover"
                />
              </div>
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="relative h-32 w-full sm:h-40">
                <img
                  src="/icons/hero2.jpeg"
                  alt="Hero preview 2"
                  className="h-full w-full object-cover"
                />
              </div>
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="relative h-32 w-full sm:h-40">
                <img
                  src="/icons/hero3.jpeg"
                  alt="Hero preview 3"
                  className="h-full w-full object-cover"
                />
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-[var(--ui-foreground)] sm:text-3xl">
            {features("title")}
          </h2>
          <p className="text-sm text-[var(--ui-muted)] sm:text-base">{features("subtitle")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featureItems.map((item, index) => (
            <Card key={`feature-${index}`} variant="interactive" size="sm" className="space-y-4">
              <div className="ui-future-chip inline-flex h-12 w-12 items-center justify-center rounded-xl">
                <img src={item.icon} alt={item.title} width={26} height={26} />
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
          <h2 className="text-2xl font-bold text-[var(--ui-foreground)] sm:text-3xl">
            {workflowData.title}
          </h2>
          <p className="text-sm text-[var(--ui-muted)] sm:text-base">{workflowData.subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <Card key={`step-${index}`} variant="interactive" size="sm" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="ui-future-chip inline-flex h-12 w-12 items-center justify-center rounded-xl">
                  <img src={step.icon} alt={step.title} width={26} height={26} />
                </div>
                <span className="rounded-full bg-[var(--ui-surface-2)] px-2 py-1 text-xs font-semibold text-[var(--ui-muted)]">
                  0{index + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--ui-foreground)]">{step.title}</h3>
              <p className="text-sm text-[var(--ui-muted)]">{step.desc}</p>
            </Card>
          ))}
        </div>

        <Card className="flex flex-col items-center justify-between gap-4 p-5 text-center sm:flex-row sm:text-start">
          <div>
            <h3 className="text-lg font-semibold text-[var(--ui-foreground)]">
              {workflowData.ctaTitle}
            </h3>
            <p className="text-sm text-[var(--ui-muted)]">{workflowData.ctaSubtitle}</p>
          </div>
          <Link to="/signup">
            <Button fullWidth={false} className="px-6">
              {hero("content.hero.primaryCta")}
            </Button>
          </Link>
        </Card>
      </section>

      <section className="space-y-5">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-[var(--ui-foreground)] sm:text-3xl">
            {statsData.title}
          </h2>
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
          <h2 className="text-2xl font-bold text-[var(--ui-foreground)] sm:text-3xl">
            {testimonialData.title}
          </h2>
          <p className="text-sm text-[var(--ui-muted)] sm:text-base">
            {testimonialData.subtitle}
          </p>
        </div>

        <Card className="space-y-5 p-5 sm:p-7">
          {currentTestimonial ? (
            <>
              <div className="flex items-center gap-4">
                <div className="ui-future-chip flex h-14 w-14 items-center justify-center rounded-full">
                  <img
                    src={currentTestimonial.image || "/icons/ai.svg"}
                    alt={currentTestimonial.name || "Testimonial"}
                    width={34}
                    height={34}
                  />
                </div>
                <div>
                  <p className="font-semibold text-[var(--ui-foreground)]">
                    {currentTestimonial.name}
                  </p>
                  <p className="text-sm text-[var(--ui-muted)]">{currentTestimonial.role}</p>
                </div>
              </div>

              <p className="text-sm leading-7 text-[var(--ui-foreground)] sm:text-base">
                {currentTestimonial.text}
              </p>

              <div className="flex items-center justify-between">
                <Button
                  variant="secondary"
                  fullWidth={false}
                  size="sm"
                  className="px-4"
                  onClick={prevTestimonial}
                >
                  ←
                </Button>
                <div className="flex items-center gap-2">
                  {testimonialItems.map((_, idx) => (
                    <button
                      key={`dot-${idx}`}
                      type="button"
                      onClick={() => setActiveTestimonial(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        idx === activeTestimonial
                          ? "w-8 bg-[var(--color-primary-500)]"
                          : "w-2.5 bg-[var(--ui-border)]"
                      }`}
                      aria-label={`testimonial-${idx + 1}`}
                    />
                  ))}
                </div>
                <Button
                  variant="secondary"
                  fullWidth={false}
                  size="sm"
                  className="px-4"
                  onClick={nextTestimonial}
                >
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
                <span className="text-sm font-medium text-[var(--ui-foreground)]">
                  {badge.text}
                </span>
              </Card>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SimpleContentPage({
  ns,
  fallbackTitle,
  fallbackBody,
}: {
  ns: string;
  fallbackTitle: string;
  fallbackBody: string;
}) {
  const { t } = useTranslation(ns);
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Card className="p-8">
        <h1 className="brand-gradient-text text-2xl font-extrabold">
          {t("title", fallbackTitle)}
        </h1>
        <p className="mt-4 leading-relaxed text-[var(--ui-muted)]">
          {t("description", fallbackBody)}
        </p>
      </Card>
    </div>
  );
}

export const AboutPage = () => (
  <SimpleContentPage
    ns="about"
    fallbackTitle="About PneumoDetect"
    fallbackBody="PneumoDetect assists clinicians and patients with AI-assisted chest X-ray screening and integrated follow-up care."
  />
);

export const ServicesPage = () => (
  <SimpleContentPage
    ns="services"
    fallbackTitle="Medical & AI Services"
    fallbackBody="Automated chest X-ray pneumonia screening, Grad-CAM visual heatmaps, appointment scheduling, and doctor-patient chat."
  />
);

export const BlogPage = () => (
  <SimpleContentPage
    ns="blog"
    fallbackTitle="Medical Insights & Updates"
    fallbackBody="Research notes and clinical updates on AI-assisted radiology and respiratory care."
  />
);

export const FaqPage = () => (
  <SimpleContentPage
    ns="faq"
    fallbackTitle="Frequently Asked Questions"
    fallbackBody="Learn how X-ray uploads, AI predictions, and doctor consultations work on PneumoDetect."
  />
);

export const ContactPage = () => (
  <SimpleContentPage
    ns="contact"
    fallbackTitle="Contact Us"
    fallbackBody="Reach out to the PneumoDetect support team for technical or clinical onboarding assistance."
  />
);

export const PrivacyPage = () => (
  <SimpleContentPage
    ns="privacyPage"
    fallbackTitle="Privacy Policy"
    fallbackBody="Patient medical records, X-ray scans, and communications are protected with strict role-based access control."
  />
);

export const TermsPage = () => (
  <SimpleContentPage
    ns="termsPage"
    fallbackTitle="Terms of Service"
    fallbackBody="AI predictions are clinical decision-support aids and should always be reviewed by a qualified physician."
  />
);

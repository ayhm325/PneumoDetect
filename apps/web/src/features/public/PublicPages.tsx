import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaChevronDown, FaShieldAlt, FaStethoscope } from "react-icons/fa";

export function HomePage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
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

  return (
    <div className="bg-[var(--ui-surface-2)] text-[var(--ui-foreground)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--ui-border)] bg-[var(--ui-surface)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(79,70,229,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(8,145,178,0.10),transparent_55%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="space-y-7 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-500)]/25 bg-[var(--color-primary-100)]/60 px-3.5 py-1.5 text-xs font-bold text-[var(--color-primary-900)] dark:bg-[var(--color-primary-900)]/30 dark:text-[var(--color-primary-100)]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span>{hero("futuristic.actions.analyzeXray")}</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl font-black leading-[1.2] tracking-tight text-[var(--ui-foreground)] sm:text-4xl lg:text-5xl">
                  {hero("content.hero.title")}
                </h1>
                <p className="text-base font-medium text-[var(--color-primary-500)] sm:text-lg">
                  {hero("content.hero.subtitle")}
                </p>
                <p className="max-w-xl text-sm leading-7 text-[var(--ui-muted)] sm:text-base">
                  {hero("content.hero.desc")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3.5">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-500)] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-[var(--color-primary-900)]"
                >
                  <span>{hero("content.hero.primaryCta")}</span>
                  {isAr ? <FaArrowLeft className="text-xs" /> : <FaArrowRight className="text-xs" />}
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--ui-border-strong)] bg-[var(--ui-surface)] px-6 py-3.5 text-sm font-bold text-[var(--ui-foreground)] transition hover:bg-[var(--ui-surface-2)]"
                >
                  {hero("content.hero.secondaryCta")}
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {heroStats.map((item, index) => (
                  <div
                    key={`hero-stat-${index}`}
                    className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)]/70 p-3.5"
                  >
                    <p className="text-xl font-black tabular-nums text-[var(--color-primary-500)] sm:text-2xl">
                      {item.value}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-[var(--ui-muted)]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bento Medical Visual Grid */}
            <div className="grid grid-cols-2 gap-4 lg:col-span-6">
              <div className="group relative col-span-2 overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-slate-900 shadow-lg">
                <img
                  src="/icons/hero1.jpeg"
                  alt="AI Chest X-Ray Screening"
                  className="h-60 w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 sm:h-72"
                />
                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl border border-white/15 bg-slate-950/75 px-4 py-3 text-white backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <FaStethoscope className="text-cyan-400" />
                    <div>
                      <p className="text-xs font-bold">DenseNet121 + Grad-CAM</p>
                      <p className="text-[11px] text-slate-300">
                        {isAr ? "تحليل فوري وخريطة حرارية" : "Instant Screening & Heatmap"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                    Active
                  </span>
                </div>
              </div>

              <div className="group overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-sm">
                <img
                  src="/icons/hero2.jpeg"
                  alt="Radiology Review"
                  className="h-36 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-44"
                />
              </div>
              <div className="group overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-sm">
                <img
                  src="/icons/hero3.jpeg"
                  alt="Doctor Consultation"
                  className="h-36 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-44"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {features("title")}
          </h2>
          <p className="mt-2.5 text-sm text-[var(--ui-muted)] sm:text-base">
            {features("subtitle")}
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featureItems.map((item, index) => (
            <div
              key={`feature-${index}`}
              className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-xs transition hover:-translate-y-0.5 hover:border-[var(--color-primary-500)]/40 hover:shadow-md"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-100)] dark:bg-[var(--color-primary-900)]/40">
                <img src={item.icon} alt={item.title} width={26} height={26} />
              </div>
              <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ui-muted)]">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {extraItems.map((item, index) => (
            <div
              key={`extra-${index}`}
              className="flex items-start gap-4 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ui-surface-2)] text-xl">
                {item.icon}
              </span>
              <div>
                <h4 className="font-bold">{item.title}</h4>
                <p className="mt-1 text-sm text-[var(--ui-muted)]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clinical Workflow */}
      <section className="border-y border-[var(--ui-border)] bg-[var(--ui-surface)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {workflowData.title}
            </h2>
            <p className="mt-2.5 text-sm text-[var(--ui-muted)] sm:text-base">
              {workflowData.subtitle}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <div
                key={`step-${index}`}
                className="relative rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)]/60 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ui-surface)] shadow-xs">
                    <img src={step.icon} alt={step.title} width={26} height={26} />
                  </div>
                  <span className="rounded-full bg-[var(--color-primary-500)]/10 px-3 py-1 text-xs font-extrabold text-[var(--color-primary-500)]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ui-muted)]">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="mt-10 flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-[var(--color-primary-500)] via-indigo-600 to-[var(--color-secondary-500)] p-8 text-white shadow-xl sm:flex-row">
            <div>
              <h3 className="text-xl font-extrabold">{workflowData.ctaTitle}</h3>
              <p className="mt-1 text-sm text-indigo-100">{workflowData.ctaSubtitle}</p>
            </div>
            <Link
              to="/signup"
              className="shrink-0 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[var(--color-primary-900)] shadow-sm transition hover:bg-indigo-50"
            >
              {hero("content.hero.primaryCta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {statsData.title}
          </h2>
          <p className="mt-2 text-sm text-[var(--ui-muted)] sm:text-base">{statsData.subtitle}</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <div
              key={`stat-${index}`}
              className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-xs"
            >
              <span className="text-2xl" aria-hidden="true">
                {stat.icon}
              </span>
              <p className="mt-3 text-3xl font-black tabular-nums text-[var(--color-primary-500)]">
                {stat.number}
                {stat.suffix}
              </p>
              <p className="mt-1 font-bold">{stat.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--ui-muted)]">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {testimonialData.title}
          </h2>
          <p className="mt-2 text-sm text-[var(--ui-muted)] sm:text-base">
            {testimonialData.subtitle}
          </p>
        </div>

        {currentTestimonial && (
          <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-100)] dark:bg-[var(--color-primary-900)]/40">
                <img
                  src={currentTestimonial.image || "/icons/ai.svg"}
                  alt={currentTestimonial.name}
                  width={28}
                  height={28}
                />
              </div>
              <div>
                <p className="font-bold">{currentTestimonial.name}</p>
                <p className="text-xs text-[var(--ui-muted)]">{currentTestimonial.role}</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-[var(--ui-foreground)] sm:text-base">
              “{currentTestimonial.text}”
            </p>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setActiveTestimonial(
                    (prev) => (prev - 1 + testimonialItems.length) % testimonialItems.length,
                  )
                }
                className="rounded-xl border border-[var(--ui-border)] px-4 py-1.5 text-sm font-bold hover:bg-[var(--ui-surface-2)]"
              >
                {isAr ? "→" : "←"}
              </button>
              <div className="flex items-center gap-2">
                {testimonialItems.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    type="button"
                    onClick={() => setActiveTestimonial(idx)}
                    aria-label={`testimonial-${idx + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      idx === activeTestimonial
                        ? "w-8 bg-[var(--color-primary-500)]"
                        : "w-2 bg-[var(--ui-border-strong)]"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setActiveTestimonial((prev) => (prev + 1) % testimonialItems.length)
                }
                className="rounded-xl border border-[var(--ui-border)] px-4 py-1.5 text-sm font-bold hover:bg-[var(--ui-surface-2)]"
              >
                {isAr ? "←" : "→"}
              </button>
            </div>
          </div>
        )}

        {testimonialBadges.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {testimonialBadges.map((badge, index) => (
              <div
                key={`badge-${index}`}
                className="flex items-center gap-2.5 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 text-sm font-semibold"
              >
                <span>{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function FaqPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const items = isAr
    ? [
        {
          q: "كيف يعمل تحليل الأشعة بالذكاء الاصطناعي؟",
          a: "يتم رفع صورة الأشعة السينية للصدر، ويقوم نموذج DenseNet121 بتحليلها خلال ثوانٍ وإنتاج خريطة حرارية (Grad-CAM) توضح المناطق المشتبه بها.",
        },
        {
          q: "هل تغني النتيجة عن استشارة الطبيب؟",
          a: "لا، النظام أداة مساعدة لاتخاذ القرار السريري ويجب دائماً مراجعة النتيجة مع طبيب مختص عبر المنصة.",
        },
        {
          q: "هل بياناتي وصوري الطبية آمنة؟",
          a: "نعم، جميع الجلسات محمية بملفات تعريف HttpOnly مع صلاحيات وصول صارمة حسب الدور الطبي.",
        },
      ]
    : [
        {
          q: "How does AI X-ray analysis work?",
          a: "Upload a chest X-ray image and our DenseNet121 model returns a screening prediction with a Grad-CAM heatmap in seconds.",
        },
        {
          q: "Does this replace a physician diagnosis?",
          a: "No. PneumoDetect is a clinical decision-support aid; all results should be reviewed with a qualified doctor on the portal.",
        },
        {
          q: "Is my medical data protected?",
          a: "Yes. Sessions use HttpOnly cookies with token revocation and strict role-based access control.",
        },
      ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">{isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}</h1>
        <p className="mt-2 text-sm text-[var(--ui-muted)]">
          {isAr ? "إجابات واضحة حول التشخيص الذكي وخصوصية البيانات" : "Clear answers about AI screening and data privacy"}
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {items.map((item, idx) => {
          const open = openIdx === idx;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)]"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : idx)}
                className="flex w-full items-center justify-between px-5 py-4 text-start text-sm font-bold"
              >
                <span>{item.q}</span>
                <FaChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open && (
                <div className="border-t border-[var(--ui-border)] px-5 py-4 text-sm leading-relaxed text-[var(--ui-muted)]">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ContactPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary-100)] text-[var(--color-primary-500)]">
            <FaShieldAlt />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">{isAr ? "تواصل معنا" : "Contact Us"}</h1>
            <p className="text-xs text-[var(--ui-muted)]">
              {isAr ? "فريق الدعم الفني والطبي جاهز لمساعدتك" : "Technical and clinical onboarding support"}
            </p>
          </div>
        </div>

        {sent ? (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            <FaCheckCircle />
            <span>{isAr ? "تم استلام رسالتك بنجاح!" : "Your message has been received!"}</span>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="mt-6 space-y-4"
          >
            <input
              type="text"
              required
              placeholder={isAr ? "الاسم الكامل" : "Full name"}
              className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary-500)]"
            />
            <input
              type="email"
              required
              placeholder={isAr ? "البريد الإلكتروني" : "Email address"}
              className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary-500)]"
            />
            <textarea
              rows={4}
              required
              placeholder={isAr ? "اكتب رسالتك..." : "Write your message..."}
              className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary-500)]"
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--color-primary-500)] px-6 py-2.5 text-sm font-bold text-white hover:bg-[var(--color-primary-900)]"
            >
              {isAr ? "إرسال الرسالة" : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

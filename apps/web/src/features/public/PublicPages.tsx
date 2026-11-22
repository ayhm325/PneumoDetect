import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBolt,
  FaCalendarCheck,
  FaChartBar,
  FaCheckCircle,
  FaChevronDown,
  FaComments,
  FaFileMedicalAlt,
  FaGlobe,
  FaLock,
  FaShieldAlt,
  FaStethoscope,
  FaUserMd,
  FaUserShield,
  FaXRay,
} from "react-icons/fa";
import { MedicalScannerHero } from "@/components/home/MedicalScannerHero";

export function HomePage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { t: hero } = useTranslation("hero");
  const { t: features } = useTranslation("features");
  const { t: workflow } = useTranslation("workflowsection");
  const [previewTab, setPreviewTab] = useState<"ai" | "care">("ai");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const workflowData = (workflow("content.workflow", { returnObjects: true }) || {}) as {
    title?: string;
    subtitle?: string;
    ctaTitle?: string;
    ctaSubtitle?: string;
    steps?: Array<{ icon?: string; title: string; desc: string }>;
  };
  const workflowSteps = Array.isArray(workflowData.steps) ? workflowData.steps : [];

  const capabilities = [
    {
      icon: FaXRay,
      title: features("item1.title"),
      desc: features("item1.desc"),
    },
    {
      icon: FaFileMedicalAlt,
      title: features("item2.title"),
      desc: features("item2.desc"),
    },
    {
      icon: FaUserMd,
      title: features("item3.title"),
      desc: features("item3.desc"),
    },
  ];

  const highlights = [
    { icon: FaLock, title: features("extra1.title"), desc: features("extra1.desc") },
    { icon: FaBolt, title: features("extra2.title"), desc: features("extra2.desc") },
    { icon: FaChartBar, title: features("extra3.title"), desc: features("extra3.desc") },
    { icon: FaGlobe, title: features("extra4.title"), desc: features("extra4.desc") },
  ];

  const securityPillars = isAr
    ? [
        {
          icon: FaUserShield,
          title: "صلاحيات دقيقة حسب الدور",
          desc: "عزل كامل لبيانات المرضى بحيث يصل كل طبيب فقط إلى مرضاه المرتبطين به.",
        },
        {
          icon: FaLock,
          title: "جلسات محمية وملفات آمنة",
          desc: "توثيق عبر HttpOnly Cookies مع إمكانية إلغاء الجلسات الفوري والتحقق من الروابط.",
        },
        {
          icon: FaStethoscope,
          title: "قرار سريري بيد الطبيب",
          desc: "الذكاء الاصطناعي أداة مساعدة للفرز البصري، ويظل التشخيص النهائي بيد الطبيب المختص.",
        },
      ]
    : [
        {
          icon: FaUserShield,
          title: "Strict Role-Based Access",
          desc: "Patient records and conversations are scoped strictly to authorized linked physicians.",
        },
        {
          icon: FaLock,
          title: "Hardened Session & File Security",
          desc: "HttpOnly JWT cookies, token revocation checks, and signed upload paths.",
        },
        {
          icon: FaStethoscope,
          title: "Physician-Led Decisions",
          desc: "AI screening supports clinical review; final diagnosis always remains with the doctor.",
        },
      ];

  const faqPreview = isAr
    ? [
        {
          q: "كيف يساعد نموذج الذكاء الاصطناعي في قراءة الأشعة؟",
          a: "يحلل نموذج DenseNet121 صورة الأشعة السينية للصدر وينتج خريطة حرارية (Grad-CAM) تبرز المناطق ذات الأهمية لتسريع المراجعة السريرية.",
        },
        {
          q: "هل يغني التحليل الآلي عن مراجعة الطبيب؟",
          a: "لا. المنصة أداة مساعدة لدعم القرار الطبي وليست بديلاً عن التشخيص الطبي المعتمد من الطبيب.",
        },
        {
          q: "كيف يتواصل المريض مع طبيبه بعد الفحص؟",
          a: "من خلال بوابة المريض يمكن حجز موعد ومشاركة نتائج الأشعة والتواصل المباشر عبر المحادثة الفورية.",
        },
      ]
    : [
        {
          q: "How does the AI model assist with chest X-rays?",
          a: "DenseNet121 screens uploaded chest X-rays and generates a Grad-CAM heatmap highlighting regions of interest for faster clinical review.",
        },
        {
          q: "Does AI screening replace a doctor's diagnosis?",
          a: "No. PneumoDetect is a clinical decision-support tool; every result should be reviewed by a qualified physician.",
        },
        {
          q: "How do patients follow up with their doctor?",
          a: "Patients can review their scan history, book appointments, and message their assigned doctor in real time.",
        },
      ];

  const ArrowIcon = isAr ? FaArrowLeft : FaArrowRight;

  return (
    <div className="bg-[var(--ui-surface-2)] text-[var(--ui-foreground)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--ui-border)] bg-[var(--ui-surface)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(53,106,230,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(19,168,158,0.10),transparent_55%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Hero Copy */}
            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-500)]/25 bg-[var(--color-primary-100)]/70 px-3.5 py-1.5 text-xs font-bold text-[var(--color-primary-900)] dark:bg-[var(--color-primary-900)]/30 dark:text-[var(--color-primary-100)]">
                <FaStethoscope className="h-3.5 w-3.5 text-[var(--color-secondary-500)]" />
                <span>{hero("futuristic.actions.analyzeXray")}</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl font-black leading-[1.2] tracking-tight text-[var(--ui-foreground)] sm:text-4xl lg:text-5xl">
                  {hero("content.hero.title")}
                </h1>
                <p className="text-base font-semibold text-[var(--color-primary-500)] sm:text-lg">
                  {hero("content.hero.subtitle")}
                </p>
                <p className="max-w-xl text-sm leading-7 text-[var(--ui-muted)] sm:text-base">
                  {hero("content.hero.desc")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3.5">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-500)] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[var(--color-primary-900)]"
                >
                  <span>{hero("content.hero.primaryCta")}</span>
                  <ArrowIcon className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--ui-border-strong)] bg-[var(--ui-surface)] px-6 py-3.5 text-sm font-bold text-[var(--ui-foreground)] transition hover:bg-[var(--ui-surface-2)]"
                >
                  {hero("content.hero.secondaryCta")}
                </Link>
              </div>

              <p className="flex items-center gap-2 text-xs font-medium text-[var(--ui-muted)]">
                <FaShieldAlt className="h-3.5 w-3.5 shrink-0 text-[var(--color-secondary-500)]" />
                <span>
                  {isAr
                    ? "أداة مساعدة لدعم القرار السريري — لا تغني عن استشارة الطبيب المختص."
                    : "Clinical decision-support platform — designed to assist, never replace, qualified physicians."}
                </span>
              </p>
            </div>

            {/* Interactive Product Preview */}
            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] shadow-xl">
                <div className="flex items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ms-2 text-xs font-semibold text-[var(--ui-muted)]">
                      {isAr ? "معاينة توضيحية للواجهة" : "Illustrative Interface Preview"}
                    </span>
                  </div>
                  <div className="flex rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPreviewTab("ai")}
                      className={`rounded-md px-2.5 py-1 transition ${
                        previewTab === "ai"
                          ? "bg-[var(--color-primary-500)] text-white"
                          : "text-[var(--ui-muted)] hover:text-[var(--ui-foreground)]"
                      }`}
                    >
                      {isAr ? "تحليل الأشعة" : "AI Screening"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab("care")}
                      className={`rounded-md px-2.5 py-1 transition ${
                        previewTab === "care"
                          ? "bg-[var(--color-primary-500)] text-white"
                          : "text-[var(--ui-muted)] hover:text-[var(--ui-foreground)]"
                      }`}
                    >
                      {isAr ? "متابعة الطبيب" : "Care Flow"}
                    </button>
                  </div>
                </div>

                {previewTab === "ai" ? (
                  <div className="p-3 sm:p-5">
                    <MedicalScannerHero />
                  </div>
                ) : (
                  <div className="grid gap-3 p-5 sm:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)]/70 p-4">
                      <FaXRay className="h-5 w-5 text-[var(--color-primary-500)]" />
                      <h3 className="mt-3 text-sm font-bold">
                        {isAr ? "1. رفع الأشعة" : "1. Upload Scan"}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--ui-muted)]">
                        {isAr ? "يرفع المريض أو الطبيب صورة الأشعة السينية." : "Patient or doctor uploads a chest X-ray."}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)]/70 p-4">
                      <FaCalendarCheck className="h-5 w-5 text-[var(--color-secondary-500)]" />
                      <h3 className="mt-3 text-sm font-bold">
                        {isAr ? "2. المواعيد والنتائج" : "2. Review & Book"}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--ui-muted)]">
                        {isAr ? "متابعة الحالة وحجز موعد مع الطبيب المختص." : "Track results and schedule follow-up visits."}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)]/70 p-4">
                      <FaComments className="h-5 w-5 text-[var(--color-primary-500)]" />
                      <h3 className="mt-3 text-sm font-bold">
                        {isAr ? "3. محادثة فورية" : "3. Live Chat"}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--ui-muted)]">
                        {isAr ? "تواصل مباشر وآمن بين الطبيب والمريض." : "Direct real-time doctor–patient messaging."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Capabilities */}
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
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={`cap-${index}`}
                className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-xs transition hover:-translate-y-0.5 hover:border-[var(--color-primary-500)]/40 hover:shadow-md"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-100)] text-[var(--color-primary-500)] dark:bg-[var(--color-primary-900)]/40">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ui-muted)]">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={`highlight-${index}`}
                className="flex items-start gap-3.5 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ui-surface-2)] text-[var(--color-secondary-500)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold">{item.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ui-muted)]">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
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
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-500)] text-sm font-extrabold text-white shadow-xs">
                    0{index + 1}
                  </span>
                  <span className="text-xs font-semibold text-[var(--ui-muted)]">
                    {isAr ? "خطوة سريرية" : "Workflow Step"}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ui-muted)]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {isAr ? "الأمان والخصوصية الطبية" : "Clinical Security & Privacy"}
          </h2>
          <p className="mt-2 text-sm text-[var(--ui-muted)] sm:text-base">
            {isAr
              ? "بنية مصممة لحماية بيانات المرضى وصلاحيات الوصول بين الأدوار."
              : "Designed from the ground up for role isolation and secure medical workflows."}
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {securityPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={`sec-${idx}`}
                className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-xs"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ui-info-bg)] text-[var(--ui-info)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ui-muted)]">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Preview & Final CTA */}
      <section className="border-t border-[var(--ui-border)] bg-[var(--ui-surface)] py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-extrabold tracking-tight">
              {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h2>
            <Link
              to="/faq"
              className="text-sm font-bold text-[var(--color-primary-500)] hover:underline"
            >
              {isAr ? "عرض الكل" : "View all"}
            </Link>
          </div>

          <div className="space-y-3">
            {faqPreview.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={`faq-prev-${idx}`}
                  className="overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)]/50"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-bold text-[var(--ui-foreground)]"
                  >
                    <span>{item.q}</span>
                    <FaChevronDown
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                        isOpen ? "rotate-180 text-[var(--color-primary-500)]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-[var(--ui-border)] px-5 py-3.5 text-sm leading-relaxed text-[var(--ui-muted)]">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Final CTA Banner */}
          <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-[var(--color-accent-900)] via-[var(--color-primary-500)] to-[var(--color-secondary-500)] p-8 text-white shadow-xl sm:flex-row">
            <div>
              <h3 className="text-xl font-extrabold">{workflowData.ctaTitle}</h3>
              <p className="mt-1 text-sm text-sky-100">{workflowData.ctaSubtitle}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                to="/signup"
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[var(--color-primary-900)] shadow-sm transition hover:bg-sky-50"
              >
                {hero("content.hero.primaryCta")}
              </Link>
              <Link
                to="/contact"
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                {isAr ? "تواصل معنا" : "Contact Us"}
              </Link>
            </div>
          </div>
        </div>
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

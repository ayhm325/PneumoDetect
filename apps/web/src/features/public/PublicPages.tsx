import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BriefcaseMedicalIcon,
  CalendarCheckIcon,
  ChartColumnIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  FileHeartIcon,
  GlobeIcon,
  LockIcon,
  MessagesSquareIcon,
  ScanLineIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UserCogIcon,
  ZapIcon,
} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MedicalScannerHero } from "@/components/home/MedicalScannerHero";
import { AmbientBackdrop, LungNetworkSvg, NeuralPipelineSvg } from "@/components/visuals/MedicalIllustrations";
import { FeatureCard, Icon3D, PneumoCard, Surface, type SurfaceShape } from "@/components/ui";
import { TiltFrame } from "@/components/ui/TiltFrame";
import { pdMotion, sectionReveal } from "@/lib/motion";

export function HomePage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { t: hero } = useTranslation("hero");
  const { t: features } = useTranslation("features");
  const { t: workflow } = useTranslation("workflowsection");
  const [previewTab, setPreviewTab] = useState<"ai" | "care">("ai");
  const [activeStage, setActiveStage] = useState(0);
  const [activeLungZone, setActiveLungZone] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();

  const workflowData = (workflow("content.workflow", { returnObjects: true }) || {}) as {
    title?: string;
    subtitle?: string;
    ctaTitle?: string;
    ctaSubtitle?: string;
    steps?: Array<{ icon?: string; title: string; desc: string }>;
  };
  const workflowSteps = Array.isArray(workflowData.steps) ? workflowData.steps : [];

  const capabilities: Array<{
    icon: typeof ScanLineIcon;
    title: string;
    desc: string;
    tone: "crimson" | "parchment" | "sage" | "moss";
    shape: SurfaceShape;
  }> = [
    {
      icon: ScanLineIcon,
      title: features("item1.title"),
      desc: features("item1.desc"),
      tone: "crimson",
      shape: "arch",
    },
    {
      icon: FileHeartIcon,
      title: features("item2.title"),
      desc: features("item2.desc"),
      tone: "moss",
      shape: "slanted",
    },
    {
      icon: BriefcaseMedicalIcon,
      title: features("item3.title"),
      desc: features("item3.desc"),
      tone: "sage",
      shape: "layered",
    },
  ];

  const highlights = [
    { icon: LockIcon, title: features("extra1.title"), desc: features("extra1.desc") },
    { icon: ZapIcon, title: features("extra2.title"), desc: features("extra2.desc") },
    { icon: ChartColumnIcon, title: features("extra3.title"), desc: features("extra3.desc") },
    { icon: GlobeIcon, title: features("extra4.title"), desc: features("extra4.desc") },
  ];

  const securityPillars = isAr
    ? [
        {
          icon: UserCogIcon,
          title: "صلاحيات دقيقة حسب الدور",
          desc: "عزل كامل لبيانات المرضى بحيث يصل كل طبيب فقط إلى مرضاه المرتبطين به.",
        },
        {
          icon: LockIcon,
          title: "جلسات محمية وملفات آمنة",
          desc: "توثيق عبر HttpOnly Cookies مع إمكانية إلغاء الجلسات الفوري والتحقق من الروابط.",
        },
        {
          icon: StethoscopeIcon,
          title: "قرار سريري بيد الطبيب",
          desc: "الذكاء الاصطناعي أداة مساعدة للفرز البصري، ويظل التشخيص النهائي بيد الطبيب المختص.",
        },
      ]
    : [
        {
          icon: UserCogIcon,
          title: "Strict Role-Based Access",
          desc: "Patient records and conversations are scoped strictly to authorized linked physicians.",
        },
        {
          icon: LockIcon,
          title: "Hardened Session & File Security",
          desc: "HttpOnly JWT cookies, token revocation checks, and signed upload paths.",
        },
        {
          icon: StethoscopeIcon,
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

  const ArrowIcon = isAr ? ArrowLeftIcon : ArrowRightIcon;

  return (
    <div className="bg-[var(--pd-canvas)] text-[var(--pd-text-primary)]">
      {/* Editorial Asymmetric Hero */}
      <section className="relative overflow-hidden border-b border-[var(--pd-line)]">
        <AmbientBackdrop />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Hero Copy */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={pdMotion.page}
              className="space-y-6 lg:col-span-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--pd-acid)_28%,transparent)] bg-[var(--pd-acid-soft)] px-3.5 py-1.5 text-xs font-medium text-[var(--pd-acid)]">
                <StethoscopeIcon size={14} strokeWidth={1.7} />
                <span>{hero("futuristic.actions.analyzeXray")}</span>
              </div>

              <div className="space-y-4">
                <h1 className="pd-title text-[var(--pd-text-primary)]">
                  {hero("content.hero.title")}
                </h1>
                <p className="text-base font-medium text-[var(--pd-orchid)] sm:text-lg">
                  {hero("content.hero.subtitle")}
                </p>
                <p className="max-w-xl text-sm leading-7 text-[var(--pd-text-secondary)] sm:text-base">
                  {hero("content.hero.desc")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link to="/signup" className="pd-btn pd-btn--primary pd-btn--lg">
                  <span>{hero("content.hero.primaryCta")}</span>
                  <ArrowIcon size={16} strokeWidth={1.7} className="pd-btn__arrow" />
                </Link>
                <Link to="/login" className="pd-btn pd-btn--outline pd-btn--lg">
                  {hero("content.hero.secondaryCta")}
                </Link>
              </div>

              <p className="flex items-center gap-2.5 text-xs text-[var(--pd-text-muted)]">
                <ShieldCheckIcon size={15} strokeWidth={1.7} className="shrink-0 text-[var(--pd-moss)]" />
                <span>
                  {isAr
                    ? "أداة مساعدة لدعم القرار السريري — لا تغني عن استشارة الطبيب المختص."
                    : "Clinical decision-support platform — designed to assist, never replace, qualified physicians."}
                </span>
              </p>
            </motion.div>

            {/* Interactive 3D Tilt Product Preview */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...pdMotion.page, delay: 0.08 }}
              className="lg:col-span-6"
            >
              <TiltFrame maxTilt={6.5}>
                <div className="pd-panel pd-panel--feature overflow-hidden border-2 border-[var(--pd-line-strong)] shadow-[0_28px_56px_-16px_rgba(24,20,17,0.34),0_10px_0_0_color-mix(in_srgb,var(--pd-olive)_72%,#121a13),inset_0_2px_2px_rgba(255,255,255,0.45)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] px-4 py-3.5 shadow-[inset_0_2px_1px_rgba(255,255,255,0.35)]">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[linear-gradient(145deg,#e26666,#bd4444)] shadow-[0_2px_4px_rgba(189,68,68,0.45),inset_0_1px_1px_rgba(255,255,255,0.65)]" />
                    <span className="h-3 w-3 rounded-full bg-[linear-gradient(145deg,#faf0e1,#d7bea0)] shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.85)]" />
                    <span className="h-3 w-3 rounded-full bg-[linear-gradient(145deg,#8eb385,#677e61)] shadow-[0_2px_4px_rgba(103,126,97,0.45),inset_0_1px_1px_rgba(255,255,255,0.65)]" />
                    <span className="ms-2 text-xs font-bold text-[var(--pd-text-primary)]">
                      {isAr ? "معاينة ثلاثية الأبعاد للواجهة" : "3D Interactive Interface Preview"}
                    </span>
                  </div>
                  <div className="pd-segmented shadow-[inset_0_2px_4px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.25)]">
                    <button
                      type="button"
                      onClick={() => setPreviewTab("ai")}
                      className={`pd-chip !min-h-7 !border-0 !px-3.5 !py-1 !text-xs font-bold ${
                        previewTab === "ai"
                          ? "pd-chip--active shadow-[0_4px_10px_-2px_rgba(189,68,68,0.55),0_2px_0_0_#6b1f1f,inset_0_1px_1px_rgba(255,255,255,0.45)]"
                          : ""
                      }`}
                    >
                      {isAr ? "تحليل الأشعة 3D" : "3D AI Screening"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab("care")}
                      className={`pd-chip !min-h-7 !border-0 !px-3.5 !py-1 !text-xs font-bold ${
                        previewTab === "care"
                          ? "pd-chip--active shadow-[0_4px_10px_-2px_rgba(189,68,68,0.55),0_2px_0_0_#6b1f1f,inset_0_1px_1px_rgba(255,255,255,0.45)]"
                          : ""
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
                  <div className="grid gap-3.5 p-5 sm:grid-cols-3">
                    <div className="pd-panel pd-panel--leaf pd-panel--deep p-4">
                      <div className="pd-orb pd-orb--sm pd-orb--acid">
                        <ScanLineIcon size={16} strokeWidth={1.7} />
                      </div>
                      <h3 className="mt-3.5 text-sm font-semibold text-[var(--pd-text-primary)]">
                        {isAr ? "1. رفع الأشعة" : "1. Upload Scan"}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--pd-text-muted)]">
                        {isAr ? "يرفع المريض أو الطبيب صورة الأشعة السينية." : "Patient or doctor uploads a chest X-ray."}
                      </p>
                    </div>
                    <div className="pd-panel pd-panel--deep p-4">
                      <div className="pd-orb pd-orb--sm pd-orb--orchid">
                        <CalendarCheckIcon size={16} strokeWidth={1.7} />
                      </div>
                      <h3 className="mt-3.5 text-sm font-semibold text-[var(--pd-text-primary)]">
                        {isAr ? "2. المواعيد والنتائج" : "2. Review & Book"}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--pd-text-muted)]">
                        {isAr ? "متابعة الحالة وحجز موعد مع الطبيب المختص." : "Track results and schedule follow-up visits."}
                      </p>
                    </div>
                    <div className="pd-panel pd-panel--organic pd-panel--deep p-4">
                      <div className="pd-orb pd-orb--sm pd-orb--moss">
                        <MessagesSquareIcon size={16} strokeWidth={1.7} />
                      </div>
                      <h3 className="mt-3.5 text-sm font-semibold text-[var(--pd-text-primary)]">
                        {isAr ? "3. محادثة فورية" : "3. Live Chat"}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--pd-text-muted)]">
                        {isAr ? "تواصل مباشر وآمن بين الطبيب والمريض." : "Direct real-time doctor–patient messaging."}
                      </p>
                    </div>
                  </div>
                )}
                </div>
              </TiltFrame>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Medical AI Visualization & Interactive Lung Focus */}
      <motion.section {...sectionReveal(reduceMotion)} className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="pd-bento-grid items-center">
          <div className="pd-span-5">
            <TiltFrame maxTilt={7}>
              <PneumoCard
                tone="olive"
                hover={false}
                className="relative overflow-hidden border-2 border-[rgba(250,240,225,0.22)] p-6 shadow-[0_28px_52px_-16px_rgba(16,24,18,0.6),0_10px_0_0_#3a4a36,inset_0_2px_2px_rgba(255,255,255,0.28),inset_0_-10px_24px_rgba(0,0,0,0.28)] sm:p-8"
              >
              {/* Top specular glare */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 left-1/2 h-40 w-4/5 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(250,240,225,0.22)_0%,transparent_70%)] blur-xl"
              />
              <div className="relative mb-4 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[#faf0e1]">
                  <Icon3D icon={ScanLineIcon} tone="cream" size="sm" />
                  {isAr ? "خريطة الانتباه العصبي 3D" : "3D Neural Attention Map"}
                </span>
                <span className="rounded-2xl border border-[rgba(255,255,255,0.45)] bg-[linear-gradient(145deg,#faf0e1_0%,#e5cfb1_100%)] px-3 py-1 text-[11px] font-bold text-[#1f2920] shadow-[0_8px_16px_-6px_rgba(0,0,0,0.55),0_3px_0_0_#b59d7e,inset_0_2px_2px_rgba(255,255,255,0.9)]">
                  Grad-CAM
                </span>
              </div>

              {/* 3D stage: perspective + slow floating rotation + pedestal shadow */}
              <div className="relative mx-auto w-full max-w-[320px]" style={{ perspective: "900px" }}>
                <motion.div
                  style={{ transformStyle: "preserve-3d" }}
                  animate={
                    reduceMotion
                      ? undefined
                      : { rotateY: [-9, 9, -9], rotateX: [6, 2, 6], y: [0, -6, 0] }
                  }
                  transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                  className="drop-shadow-[0_18px_22px_rgba(10,16,12,0.55)]"
                >
                  <LungNetworkSvg activeZone={activeLungZone} className="w-full text-[#faf0e1]" />
                </motion.div>
              </div>

              <div className="relative mt-5 flex flex-wrap justify-center gap-2.5">
                {[0, 1, 2, 3].map((zone) => (
                  <motion.button
                    key={zone}
                    type="button"
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    whileTap={reduceMotion ? undefined : { y: 2 }}
                    onClick={() => setActiveLungZone(zone)}
                    className={`rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-[background,box-shadow,color] duration-200 ${
                      activeLungZone === zone
                        ? "border border-[rgba(255,255,255,0.35)] bg-[linear-gradient(145deg,#d85a5a_0%,#bd4444_55%,#8f2c2c_100%)] text-[#faf0e1] shadow-[0_10px_18px_-5px_rgba(189,68,68,0.6),0_4px_0_0_#6b1f1f,inset_0_2px_2px_rgba(255,255,255,0.42)]"
                        : "border border-[rgba(250,240,225,0.28)] bg-[linear-gradient(145deg,rgba(250,240,225,0.18)_0%,rgba(28,39,30,0.35)_100%)] text-[#faf0e1]/90 shadow-[0_8px_14px_-6px_rgba(0,0,0,0.5),0_4px_0_0_rgba(30,42,31,0.85),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:text-[#faf0e1]"
                    }`}
                  >
                    {isAr ? `منطقة 0${zone + 1}` : `Zone 0${zone + 1}`}
                  </motion.button>
                ))}
              </div>
              </PneumoCard>
            </TiltFrame>
          </div>

          <div className="pd-span-7 space-y-6">
            <div className="max-w-2xl space-y-2.5">
              <span className="pd-eyebrow">{isAr ? "التصور العلمي" : "Scientific Visualization"}</span>
              <h2 className="text-[length:var(--text-2xl)] font-medium tracking-[var(--tracking-heading)] sm:text-[length:var(--text-3xl)]">
                {features("title")}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--pd-text-secondary)] sm:text-base">
                {features("subtitle")}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {highlights.map((item, index) => {
                const tones = ["red", "olive", "sage", "cream"] as const;
                return (
                  <div key={`highlight-${index}`} className="pd-editorial flex items-start gap-3.5">
                    <Icon3D icon={item.icon} tone={tones[index % tones.length]} size="sm" className="mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-[var(--pd-text-primary)]">{item.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--pd-text-muted)]">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Capabilities — Asymmetric Bento Showcase */}
      <motion.section {...sectionReveal(reduceMotion)} className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="pd-bento-grid">
          {capabilities.map((item, index) => {
            const cardTones = ["red", "olive", "sage"] as const;
            const spans = ["pd-span-6", "pd-span-3", "pd-span-3"];
            return (
              <div key={`cap-${index}`} className={spans[index % spans.length]}>
                <FeatureCard
                  tone={cardTones[index % cardTones.length]}
                  icon={item.icon}
                  title={item.title}
                  description={item.desc}
                  className="h-full"
                />
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Interactive Connected AI Workflow */}
      <motion.section {...sectionReveal(reduceMotion)} className="relative overflow-hidden border-y border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-2.5">
              <span className="pd-eyebrow pd-eyebrow--orchid">
                {isAr ? "مسار العمل الذكي" : "Connected AI Pipeline"}
              </span>
              <h2 className="text-[length:var(--text-2xl)] font-medium tracking-[var(--tracking-heading)] sm:text-[length:var(--text-3xl)]">
                {workflowData.title}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--pd-text-secondary)] sm:text-base">
                {workflowData.subtitle}
              </p>
            </div>
            <NeuralPipelineSvg activeStep={activeStage} className="w-full max-w-[340px] shrink-0 text-[var(--pd-text-primary)]" />
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {workflowSteps.map((step, index) => {
              const isSelected = activeStage === index;
              return (
                <button
                  key={`step-${index}`}
                  type="button"
                  onClick={() => setActiveStage(index)}
                  className={`pd-card text-start transition-all ${
                    isSelected
                      ? "pd-card--cream"
                      : "bg-[var(--pd-neutral-surface)] text-[var(--pd-text-primary)] border-[var(--pd-line)] hover:border-[var(--pd-line-strong)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`pd-tabular inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                        isSelected
                          ? "bg-[var(--pd-red)] text-[#faf0e1]"
                          : "border border-current/25 opacity-75"
                      }`}
                    >
                      0{index + 1}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider opacity-70">
                      {isAr ? "مرحلة تفاعلية" : "Interactive Stage"}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-85">{step.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Privacy & Security */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-2.5">
          <span className="pd-eyebrow">{isAr ? "الثقة والحوكمة" : "Trust & Governance"}</span>
          <h2 className="text-[length:var(--text-2xl)] font-semibold tracking-[var(--tracking-heading)] sm:text-[length:var(--text-3xl)]">
            {isAr ? "الأمان والخصوصية الطبية" : "Clinical Security & Privacy"}
          </h2>
          <p className="text-sm leading-relaxed text-[var(--pd-text-secondary)] sm:text-base">
            {isAr
              ? "بنية مصممة لحماية بيانات المرضى وصلاحيات الوصول بين الأدوار."
              : "Designed from the ground up for role isolation and secure medical workflows."}
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {securityPillars.map((pillar, idx) => {
            const tones = ["olive", "sage", "red"] as const;
            return (
              <div key={`sec-${idx}`} className="pd-editorial space-y-3.5">
                <Icon3D icon={pillar.icon} tone={tones[idx % tones.length]} size="md" />
                <h3 className="text-base font-semibold text-[var(--pd-text-primary)]">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--pd-text-secondary)]">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Preview & Final CTA */}
      <section className="border-t border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="pd-eyebrow pd-eyebrow--orchid">{isAr ? "إجابات سريعة" : "Quick Answers"}</span>
              <h2 className="text-[length:var(--text-2xl)] font-semibold tracking-[var(--tracking-heading)]">
                {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
              </h2>
            </div>
            <Link to="/faq" className="pd-btn pd-btn--link text-sm">
              {isAr ? "عرض الكل" : "View all"}
            </Link>
          </div>

          <div className="divide-y divide-[var(--pd-border)] border-y border-[var(--pd-border)]">
            {faqPreview.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={`faq-prev-${idx}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-5 text-start text-base font-medium text-[var(--pd-text-primary)] transition-colors hover:text-[var(--pd-copper)]"
                  >
                    <span>{item.q}</span>
                    <ChevronDownIcon
                      size={18}
                      strokeWidth={1.6}
                      className={`shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[var(--pd-copper)]" : "text-[var(--pd-text-muted)]"
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                        transition={pdMotion.normal}
                        className="overflow-hidden"
                      >
                        <div className="pb-5 text-[15px] leading-relaxed text-[var(--pd-text-secondary)]">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Final CTA Banner — Cream (#F1DEC4) balanced against Red, Olive & Sage */}
          <PneumoCard tone="cream" hover={false} className="mt-12 flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
            <div className="space-y-1.5">
              <h3 className="text-xl font-semibold">
                {workflowData.ctaTitle}
              </h3>
              <p className="text-sm opacity-85">{workflowData.ctaSubtitle}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link to="/signup" className="pd-btn pd-btn--primary">
                {hero("content.hero.primaryCta")}
              </Link>
              <Link to="/contact" className="pd-btn pd-btn--secondary">
                {isAr ? "تواصل معنا" : "Contact Us"}
              </Link>
            </div>
          </PneumoCard>
        </div>
      </section>
    </div>
  );
}

export function FaqPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();

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
    <div className="relative overflow-hidden">
      <AmbientBackdrop />
      <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="space-y-2">
          <span className="pd-eyebrow">{isAr ? "الدعم والمعرفة" : "Knowledge Base"}</span>
          <h1 className="text-[length:var(--text-3xl)] font-medium tracking-[var(--tracking-heading)]">
            {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </h1>
          <p className="text-sm text-[var(--pd-text-secondary)]">
            {isAr
              ? "إجابات واضحة حول التشخيص الذكي وخصوصية البيانات"
              : "Clear answers about AI screening and data privacy"}
          </p>
        </div>

        <PneumoCard tone="cream" hover={false} className="mt-10 p-6 sm:p-8">
          <div className="divide-y divide-[var(--pd-ink)]/15">
            {items.map((item, idx) => {
              const open = openIdx === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenIdx(open ? null : idx)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 py-4 text-start text-base font-medium transition-opacity hover:opacity-80"
                  >
                    <span>{item.q}</span>
                    <ChevronDownIcon
                      size={18}
                      strokeWidth={1.6}
                      className={`shrink-0 transition-transform duration-200 ${
                        open ? "rotate-180 text-[var(--pd-red)]" : "opacity-60"
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                        transition={pdMotion.normal}
                        className="overflow-hidden"
                      >
                        <div className="pb-4 text-sm leading-relaxed opacity-85">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </PneumoCard>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [sent, setSent] = useState(false);

  return (
    <div className="relative overflow-hidden">
      <AmbientBackdrop />
      <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="pd-bento-grid items-stretch">
          <div className="pd-span-5">
            <FeatureCard
              eyebrow={isAr ? "الدعم والتواصل" : "Clinical Support"}
              title={isAr ? "تواصل معنا" : "Contact Us"}
              description={
                isAr
                  ? "فريق الدعم الفني والطبي جاهز لمساعدتك في الانضمام وتفعيل بوابة العيادة أو المريض."
                  : "Technical and clinical onboarding support for clinics, doctors, and patients."
              }
              icon={ShieldCheckIcon}
              tone="olive"
              className="h-full"
            >
              <LungNetworkSvg activeZone={0} className="mx-auto my-2 w-full max-w-[210px] opacity-90" />
            </FeatureCard>
          </div>

          <div className="pd-span-7">
            <PneumoCard tone="cream" hover={false} className="h-full p-7 sm:p-9">
              {sent ? (
                <div className="flex h-full items-center gap-3 rounded-2xl border border-[var(--pd-sage)]/40 bg-[var(--pd-sage)]/20 p-5 text-sm font-medium">
                  <CircleCheckIcon size={20} strokeWidth={1.7} />
                  <span>{isAr ? "تم استلام رسالتك بنجاح!" : "Your message has been received!"}</span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSent(true);
                  }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-medium">
                    {isAr ? "أرسل رسالة مباشرة" : "Send a Direct Message"}
                  </h2>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? "الاسم الكامل" : "Full name"}
                    className="pd-field"
                  />
                  <input
                    type="email"
                    required
                    placeholder={isAr ? "البريد الإلكتروني" : "Email address"}
                    className="pd-field"
                  />
                  <textarea
                    rows={4}
                    required
                    placeholder={isAr ? "اكتب رسالتك..." : "Write your message..."}
                    className="pd-field"
                  />
                  <button type="submit" className="pd-btn pd-btn--primary">
                    {isAr ? "إرسال الرسالة" : "Send Message"}
                  </button>
                </form>
              )}
            </PneumoCard>
          </div>
        </div>
      </div>
    </div>
  );
}

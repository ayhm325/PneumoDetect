import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function HomePage() {
  const { t } = useTranslation("hero");
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <section className="rounded-3xl bg-gradient-to-br from-sky-700 via-sky-600 to-teal-600 p-8 text-white shadow-xl sm:p-14">
        <span className="inline-block rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold backdrop-blur">
          {t("badge", isAr ? "تشخيص مدعوم بالذكاء الاصطناعي" : "AI-Powered Chest X-Ray Diagnostics")}
        </span>
        <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">
          {t("title", isAr ? "كشف الالتهاب الرئوي بدقة وسرعة عبر الأشعة السينية" : "Fast, Accurate Pneumonia Detection from Chest X-Rays")}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-sky-50/90 sm:text-lg">
          {t(
            "subtitle",
            isAr
              ? "منصة طبية متكاملة تربط المرضى بالأطباء مع تحليل فوري للأشعة باستخدام DenseNet121."
              : "Integrated medical platform connecting patients and doctors with instant DenseNet121 X-ray analysis.",
          )}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/login"
            className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-sky-700 shadow hover:bg-sky-50"
          >
            {t("ctaPrimary", isAr ? "ابدأ الآن" : "Get Started")}
          </Link>
          <Link
            to="/services"
            className="rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            {t("ctaSecondary", isAr ? "استكشف الخدمات" : "Explore Services")}
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          {
            title: isAr ? "تحليل فوري بالذكاء الاصطناعي" : "Instant AI Analysis",
            desc: isAr ? "رفع صورة الأشعة والحصول على النتيجة مع خريطة حرارية خلال ثوانٍ." : "Upload X-rays and receive predictions with heatmaps in seconds.",
          },
          {
            title: isAr ? "متابعة الطبيب المباشرة" : "Direct Doctor Follow-up",
            desc: isAr ? "مراجعة النتائج، حجز المواعيد، ومحادثة فورية مع الطبيب المختص." : "Review results, schedule appointments, and chat in real time.",
          },
          {
            title: isAr ? "سجل طبي آمن" : "Secure Medical Records",
            desc: isAr ? "حفظ سجل الفحوصات والتقارير الطبية مع حماية كاملة للخصوصية." : "Persistent scan history and clinical records with role-based security.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.desc}</p>
          </div>
        ))}
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
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {t("title", fallbackTitle)}
        </h1>
        <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">
          {t("description", fallbackBody)}
        </p>
      </div>
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

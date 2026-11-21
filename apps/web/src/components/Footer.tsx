import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <footer className="border-t border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-foreground)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-3 md:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-xl font-black tracking-tight text-[var(--color-primary-500)]"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-primary-500)] text-sm font-bold text-white">
                P
              </span>
              <span>PneumoDetect</span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-[var(--ui-muted)]">
              {isAr
                ? "منصة طبية متكاملة تعتمد على الذكاء الاصطناعي (DenseNet121 + Grad-CAM) لمساعدة الأطباء والمرضى في الكشف المبكر عن الالتهاب الرئوي."
                : "An integrated medical AI platform powered by DenseNet121 and Grad-CAM to assist clinicians and patients with early pneumonia screening."}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ui-muted)]">
              {isAr ? "المنصة" : "Platform"}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/services" className="text-[var(--ui-muted)] transition hover:text-[var(--color-primary-500)]">
                  {isAr ? "الخدمات" : "Services"}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-[var(--ui-muted)] transition hover:text-[var(--color-primary-500)]">
                  {isAr ? "من نحن" : "About"}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-[var(--ui-muted)] transition hover:text-[var(--color-primary-500)]">
                  {isAr ? "المدونة" : "Blog"}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-[var(--ui-muted)] transition hover:text-[var(--color-primary-500)]">
                  {isAr ? "الأسئلة الشائعة" : "FAQ"}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ui-muted)]">
              {isAr ? "القانونية والدعم" : "Legal & Support"}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/contact" className="text-[var(--ui-muted)] transition hover:text-[var(--color-primary-500)]">
                  {isAr ? "تواصل معنا" : "Contact"}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-[var(--ui-muted)] transition hover:text-[var(--color-primary-500)]">
                  {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[var(--ui-muted)] transition hover:text-[var(--color-primary-500)]">
                  {isAr ? "شروط الاستخدام" : "Terms of Service"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--ui-border)] pt-6 text-xs text-[var(--ui-muted)] sm:flex-row">
          <p>© {new Date().getFullYear()} PneumoDetect. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
          <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3 py-1 font-medium">
            {isAr ? "مساعد تشخيصي بالذكاء الاصطناعي" : "AI Clinical Decision Support"}
          </span>
        </div>
      </div>
    </footer>
  );
}

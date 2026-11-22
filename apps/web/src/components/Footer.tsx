import { ShieldCheckIcon, StethoscopeIcon } from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { pathname } = useLocation();
  const isAuthRoute =
    pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";

  return (
    <div className="mx-auto w-full max-w-7xl px-3 pb-6 pt-10 sm:px-6 lg:px-8">
      <footer className="pd-panel pd-panel--feature-alt pd-panel--deep">
        <div className={isAuthRoute ? "px-5 py-4 sm:px-6" : "px-6 py-9 sm:px-9 sm:py-11"}>
          {!isAuthRoute && (
            <div className="mb-8 grid gap-8 md:grid-cols-4">
              <div className="space-y-3.5 md:col-span-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)]"
                >
                  <span className="pd-orb pd-orb--sm pd-orb--acid">
                    <StethoscopeIcon size={17} strokeWidth={1.7} />
                  </span>
                  <span>PneumoDetect</span>
                </Link>
                <p className="max-w-md text-sm leading-relaxed text-[var(--pd-text-secondary)]">
                  {isAr
                    ? "منصة طبية متكاملة تعتمد على الذكاء الاصطناعي (DenseNet121 + Grad-CAM) لمساعدة الأطباء والمرضى في الكشف المبكر عن الالتهاب الرئوي."
                    : "An integrated medical AI platform powered by DenseNet121 and Grad-CAM to assist clinicians and patients with early pneumonia screening."}
                </p>
              </div>

              <div>
                <h3 className="pd-eyebrow mb-3.5">{isAr ? "المنصة" : "Platform"}</h3>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link to="/services" className="text-[var(--pd-text-secondary)] transition-colors hover:text-[var(--pd-acid)]">
                      {isAr ? "الخدمات" : "Services"}
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="text-[var(--pd-text-secondary)] transition-colors hover:text-[var(--pd-acid)]">
                      {isAr ? "من نحن" : "About"}
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog" className="text-[var(--pd-text-secondary)] transition-colors hover:text-[var(--pd-acid)]">
                      {isAr ? "المدونة" : "Blog"}
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="text-[var(--pd-text-secondary)] transition-colors hover:text-[var(--pd-acid)]">
                      {isAr ? "الأسئلة الشائعة" : "FAQ"}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="pd-eyebrow pd-eyebrow--orchid mb-3.5">
                  {isAr ? "القانونية والدعم" : "Legal & Support"}
                </h3>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link to="/contact" className="text-[var(--pd-text-secondary)] transition-colors hover:text-[var(--pd-acid)]">
                      {isAr ? "تواصل معنا" : "Contact"}
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-[var(--pd-text-secondary)] transition-colors hover:text-[var(--pd-acid)]">
                      {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-[var(--pd-text-secondary)] transition-colors hover:text-[var(--pd-acid)]">
                      {isAr ? "شروط الاستخدام" : "Terms of Service"}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div
            className={`flex flex-col items-center justify-between gap-3 text-xs text-[var(--pd-text-muted)] sm:flex-row ${
              isAuthRoute ? "" : "border-t border-[var(--pd-line)] pt-5"
            }`}
          >
            <p>
              © {new Date().getFullYear()} PneumoDetect.{" "}
              {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {isAuthRoute && (
                <>
                  <Link to="/privacy" className="transition-colors hover:text-[var(--pd-text-primary)]">
                    {isAr ? "الخصوصية" : "Privacy"}
                  </Link>
                  <Link to="/terms" className="transition-colors hover:text-[var(--pd-text-primary)]">
                    {isAr ? "الشروط" : "Terms"}
                  </Link>
                </>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--pd-orchid)_28%,transparent)] bg-[var(--pd-orchid-soft)] px-3 py-1 font-medium text-[var(--pd-orchid)]">
                <ShieldCheckIcon size={13} strokeWidth={1.7} />
                <span>{isAr ? "مساعد تشخيصي بالذكاء الاصطناعي" : "AI Clinical Decision Support"}</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

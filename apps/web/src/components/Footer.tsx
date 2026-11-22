import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaShieldAlt, FaStethoscope } from "react-icons/fa";

export default function Footer() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { pathname } = useLocation();
  const isAuthRoute =
    pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";

  return (
    <div className="mx-auto w-full max-w-7xl px-3 pb-4 pt-6 sm:px-6 lg:px-8">
      <footer className="rounded-2xl border border-white/15 bg-[var(--ui-topbar-bg)]/95 text-white shadow-lg backdrop-blur-md">
        <div className={isAuthRoute ? "px-5 py-4 sm:px-6" : "px-5 py-8 sm:px-8 sm:py-10"}>
          {!isAuthRoute && (
            <div className="mb-8 grid gap-8 md:grid-cols-4">
              <div className="space-y-3 md:col-span-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-wide text-white"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sky-300 shadow-xs">
                    <FaStethoscope className="h-4 w-4" />
                  </span>
                  <span>PneumoDetect</span>
                </Link>
                <p className="max-w-md text-sm leading-relaxed text-white/75">
                  {isAr
                    ? "منصة طبية متكاملة تعتمد على الذكاء الاصطناعي (DenseNet121 + Grad-CAM) لمساعدة الأطباء والمرضى في الكشف المبكر عن الالتهاب الرئوي."
                    : "An integrated medical AI platform powered by DenseNet121 and Grad-CAM to assist clinicians and patients with early pneumonia screening."}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-200/80">
                  {isAr ? "المنصة" : "Platform"}
                </h3>
                <ul className="mt-3.5 space-y-2 text-sm">
                  <li>
                    <Link to="/services" className="text-white/75 transition hover:text-white">
                      {isAr ? "الخدمات" : "Services"}
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="text-white/75 transition hover:text-white">
                      {isAr ? "من نحن" : "About"}
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog" className="text-white/75 transition hover:text-white">
                      {isAr ? "المدونة" : "Blog"}
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="text-white/75 transition hover:text-white">
                      {isAr ? "الأسئلة الشائعة" : "FAQ"}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-200/80">
                  {isAr ? "القانونية والدعم" : "Legal & Support"}
                </h3>
                <ul className="mt-3.5 space-y-2 text-sm">
                  <li>
                    <Link to="/contact" className="text-white/75 transition hover:text-white">
                      {isAr ? "تواصل معنا" : "Contact"}
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-white/75 transition hover:text-white">
                      {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-white/75 transition hover:text-white">
                      {isAr ? "شروط الاستخدام" : "Terms of Service"}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div
            className={`flex flex-col items-center justify-between gap-3 text-xs text-white/75 sm:flex-row ${
              isAuthRoute ? "" : "border-t border-white/10 pt-5"
            }`}
          >
            <p>
              © {new Date().getFullYear()} PneumoDetect.{" "}
              {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {isAuthRoute && (
                <>
                  <Link to="/privacy" className="transition hover:text-white">
                    {isAr ? "الخصوصية" : "Privacy"}
                  </Link>
                  <Link to="/terms" className="transition hover:text-white">
                    {isAr ? "الشروط" : "Terms"}
                  </Link>
                </>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 font-semibold text-sky-100">
                <FaShieldAlt className="h-3 w-3 text-sky-300" />
                <span>{isAr ? "مساعد تشخيصي بالذكاء الاصطناعي" : "AI Clinical Decision Support"}</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

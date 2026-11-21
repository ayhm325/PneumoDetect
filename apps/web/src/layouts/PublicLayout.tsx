import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { applyDocumentDirection } from "@/i18n/config";
import { useAuth } from "@/stores/authStore";

export function PublicLayout() {
  const { t, i18n } = useTranslation("navbar");
  const { user } = useAuth();

  const toggleLanguage = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
    applyDocumentDirection(next);
  };

  const portalLink =
    user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "doctor"
        ? "/doctor/dashboard"
        : "/patient/dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-[#dff2e5] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-sky-700 dark:text-sky-400">
            <span>PneumoDetect</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link to="/" className="hover:text-sky-600">{t("home", "Home")}</Link>
            <Link to="/services" className="hover:text-sky-600">{t("services", "Services")}</Link>
            <Link to="/about" className="hover:text-sky-600">{t("about", "About")}</Link>
            <Link to="/blog" className="hover:text-sky-600">{t("blog", "Blog")}</Link>
            <Link to="/faq" className="hover:text-sky-600">{t("faq", "FAQ")}</Link>
            <Link to="/contact" className="hover:text-sky-600">{t("contact", "Contact")}</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {i18n.language === "ar" ? "EN" : "AR"}
            </button>

            {user ? (
              <Link
                to={portalLink}
                className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
              >
                {t("dashboard", "Dashboard")}
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
              >
                {t("login", "Login")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200/80 bg-white/70 py-6 text-center text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row">
          <p>© {new Date().getFullYear()} PneumoDetect. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:underline">{t("privacy", "Privacy")}</Link>
            <Link to="/terms" className="hover:underline">{t("terms", "Terms")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

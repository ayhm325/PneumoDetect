import { ArrowLeftIcon, ArrowRightIcon, MenuIcon, MoonIcon, StethoscopeIcon, SunIcon, XIcon } from "lucide-react";
import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import i18n, { applyDocumentDirection } from "@/i18n/config";
import { useTheme } from "@/lib/compat/theme";
import { useAuth } from "@/stores/authStore";
import { pdMotion } from "@/lib/motion";

export default function Navbar() {
  const { t } = useTranslation("navbar");
  const isAr = i18n.language === "ar";
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const isAuthRoute =
    pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";

  const handleToggleLocale = () => {
    const next = isAr ? "en" : "ar";
    i18n.changeLanguage(next);
    applyDocumentDirection(next);
  };

  const portalPath =
    user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "doctor"
        ? "/doctor/dashboard"
        : "/patient/dashboard";

  const links = [
    { to: "/", label: t("home", isAr ? "الرئيسية" : "Home") },
    { to: "/services", label: t("services", isAr ? "الخدمات" : "Services") },
    { to: "/about", label: t("about", isAr ? "من نحن" : "About") },
    { to: "/blog", label: t("blog", isAr ? "المدونة" : "Blog") },
    { to: "/faq", label: t("faq", isAr ? "الأسئلة" : "FAQ") },
    { to: "/contact", label: t("contact", isAr ? "تواصل معنا" : "Contact") },
  ];

  const BackIcon = isAr ? ArrowRightIcon : ArrowLeftIcon;

  return (
    <div className="sticky top-3 z-40 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
      <header className="shape-leaf border border-[var(--pd-line)] bg-[var(--pd-surface)]/92 text-[var(--pd-text-primary)] shadow-[var(--pd-shadow-depth)] backdrop-blur-md">
        <div className="flex h-[68px] items-center justify-between gap-3 px-4 sm:px-6">
          {/* Brand */}
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5 text-lg font-semibold tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)]"
          >
            <span className="pd-orb pd-orb--sm pd-orb--acid">
              <StethoscopeIcon size={17} strokeWidth={1.7} />
            </span>
            <span>PneumoDetect</span>
          </Link>

          {/* Primary Nav */}
          {!isAuthRoute && (
            <nav className="hidden min-w-0 items-center gap-0.5 md:flex lg:gap-1" aria-label="Primary navigation">
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `relative whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors lg:px-3.5 lg:py-2 ${
                      isActive
                        ? "bg-[var(--pd-acid-soft)] text-[var(--pd-acid)]"
                        : "text-[var(--pd-text-secondary)] hover:bg-[var(--pd-surface-raised)] hover:text-[var(--pd-text-primary)]"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {isAuthRoute && (
              <Link to="/" className="pd-btn pd-btn--secondary pd-btn--sm">
                <BackIcon size={15} strokeWidth={1.7} />
                <span>{t("home", isAr ? "الرئيسية" : "Home")}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to warm clay theme" : "Switch to night fig theme"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] text-[var(--pd-text-secondary)] transition-colors hover:border-[var(--pd-line-strong)] hover:text-[var(--pd-text-primary)]"
            >
              {isDark ? (
                <SunIcon size={17} strokeWidth={1.7} className="text-[var(--pd-marigold)]" />
              ) : (
                <MoonIcon size={17} strokeWidth={1.7} className="text-[var(--pd-orchid)]" />
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleLocale}
              aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] px-3.5 text-xs font-medium tracking-wider text-[var(--pd-text-secondary)] transition-colors hover:border-[var(--pd-line-strong)] hover:text-[var(--pd-text-primary)]"
            >
              {isAr ? "EN" : "AR"}
            </button>

            {!isAuthRoute && (
              <>
                {user ? (
                  <Link
                    to={portalPath}
                    className="pd-btn pd-btn--primary pd-btn--sm hidden sm:inline-flex"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--pd-on-accent)]/15 text-[11px] font-semibold">
                      {(user.fullName || user.email || "U").slice(0, 2).toUpperCase()}
                    </span>
                    <span>{t("dashboard", isAr ? "لوحة التحكم" : "Dashboard")}</span>
                  </Link>
                ) : (
                  <div className="hidden items-center gap-2 sm:flex">
                    <Link to="/login" className="pd-btn pd-btn--ghost pd-btn--sm">
                      {t("login", isAr ? "تسجيل الدخول" : "Login")}
                    </Link>
                    <Link to="/signup" className="pd-btn pd-btn--primary pd-btn--sm">
                      {t("signup", isAr ? "إنشاء حساب" : "Sign Up")}
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setMobileOpen((o) => !o)}
                  aria-label="Toggle menu"
                  aria-expanded={mobileOpen}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] text-[var(--pd-text-primary)] transition-colors hover:bg-[var(--pd-surface-raised)] md:hidden"
                >
                  {mobileOpen ? <XIcon size={18} strokeWidth={1.7} /> : <MenuIcon size={18} strokeWidth={1.7} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {!isAuthRoute && mobileOpen && (
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={pdMotion.fast}
              className="overflow-hidden border-t border-[var(--pd-line)] md:hidden"
            >
              <nav className="flex flex-col gap-1 px-4 py-3">
                {links.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `rounded-[var(--shape-control)] px-3.5 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[var(--pd-acid-soft)] text-[var(--pd-acid)]"
                          : "text-[var(--pd-text-secondary)] hover:bg-[var(--pd-surface-raised)] hover:text-[var(--pd-text-primary)]"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                {user ? (
                  <Link
                    to={portalPath}
                    onClick={() => setMobileOpen(false)}
                    className="pd-btn pd-btn--primary mt-2 w-full"
                  >
                    {t("dashboard", isAr ? "لوحة التحكم" : "Dashboard")}
                  </Link>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="pd-btn pd-btn--secondary w-full"
                    >
                      {t("login", isAr ? "تسجيل الدخول" : "Login")}
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="pd-btn pd-btn--primary w-full"
                    >
                      {t("signup", isAr ? "إنشاء حساب" : "Sign Up")}
                    </Link>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
}

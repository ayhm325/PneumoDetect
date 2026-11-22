import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBars,
  FaMoon,
  FaStethoscope,
  FaSun,
  FaTimes,
} from "react-icons/fa";
import i18n, { applyDocumentDirection } from "@/i18n/config";
import { useTheme } from "@/lib/compat/theme";
import { useAuth } from "@/stores/authStore";

export default function Navbar() {
  const { t } = useTranslation("navbar");
  const isAr = i18n.language === "ar";
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const BackIcon = isAr ? FaArrowRight : FaArrowLeft;

  return (
    <div className="sticky top-3 z-40 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-white/15 bg-[var(--ui-topbar-bg)]/95 text-white shadow-lg backdrop-blur-md">
        <div className="flex h-[66px] items-center justify-between gap-3 px-4 sm:px-6">
          {/* Brand */}
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5 text-lg font-extrabold tracking-wide text-white"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sky-300 shadow-xs">
              <FaStethoscope className="h-4 w-4" />
            </span>
            <span>PneumoDetect</span>
          </Link>

          {/* Primary Nav (hidden on auth screens to keep login/signup focused) */}
          {!isAuthRoute && (
            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-white/15 text-white shadow-2xs"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Actions (unified with PortalTopbar) */}
          <div className="flex shrink-0 items-center gap-2">
            {isAuthRoute && (
              <Link
                to="/"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                <BackIcon className="h-3 w-3" />
                <span>{t("home", isAr ? "الرئيسية" : "Home")}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              {isDark ? <FaSun className="h-4 w-4 text-amber-300" /> : <FaMoon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={handleToggleLocale}
              aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold tracking-wide text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              {isAr ? "EN" : "AR"}
            </button>

            {!isAuthRoute && (
              <>
                {user ? (
                  <Link
                    to={portalPath}
                    className="hidden h-10 items-center gap-2 rounded-xl bg-sky-500 px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-sky-400 sm:inline-flex"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 text-[10px] font-bold">
                      {(user.fullName || user.email || "U").slice(0, 2).toUpperCase()}
                    </span>
                    <span>{t("dashboard", isAr ? "لوحة التحكم" : "Dashboard")}</span>
                  </Link>
                ) : (
                  <div className="hidden items-center gap-2 sm:flex">
                    <Link
                      to="/login"
                      className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/10 px-3.5 text-xs font-bold text-white transition hover:bg-white/20"
                    >
                      {t("login", isAr ? "تسجيل الدخول" : "Login")}
                    </Link>
                    <Link
                      to="/signup"
                      className="inline-flex h-10 items-center rounded-xl bg-sky-500 px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-sky-400"
                    >
                      {t("signup", isAr ? "إنشاء حساب" : "Sign Up")}
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setMobileOpen((o) => !o)}
                  aria-label="Toggle menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 md:hidden"
                >
                  {mobileOpen ? <FaTimes className="h-4 w-4" /> : <FaBars className="h-4 w-4" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Drawer */}
        {!isAuthRoute && mobileOpen && (
          <div className="border-t border-white/10 px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
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
                  className="mt-2 rounded-xl bg-sky-500 px-4 py-2.5 text-center text-sm font-bold text-white"
                >
                  {t("dashboard", isAr ? "لوحة التحكم" : "Dashboard")}
                </Link>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-center text-sm font-bold text-white"
                  >
                    {t("login", isAr ? "تسجيل الدخول" : "Login")}
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl bg-sky-500 px-4 py-2.5 text-center text-sm font-bold text-white"
                  >
                    {t("signup", isAr ? "إنشاء حساب" : "Sign Up")}
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
    </div>
  );
}

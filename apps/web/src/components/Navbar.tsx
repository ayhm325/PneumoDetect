import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaBars, FaMoon, FaSun, FaTimes } from "react-icons/fa";
import i18n, { applyDocumentDirection } from "@/i18n/config";
import { useTheme } from "@/lib/compat/theme";
import { useAuth } from "@/stores/authStore";

export default function Navbar() {
  const { t } = useTranslation("navbar");
  const isAr = i18n.language === "ar";
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ui-border)] bg-[var(--ui-surface)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-xl font-black tracking-tight text-[var(--color-primary-500)]"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-primary-500)] text-sm font-bold text-white shadow-xs">
            P
          </span>
          <span>PneumoDetect</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[var(--color-primary-100)] text-[var(--color-primary-900)] dark:bg-[var(--color-primary-900)]/40 dark:text-[var(--color-primary-100)]"
                    : "text-[var(--ui-muted)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-foreground)]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-foreground)] transition hover:bg-[var(--ui-surface-2)]"
          >
            {isDark ? <FaSun className="text-amber-400" /> : <FaMoon />}
          </button>

          <button
            type="button"
            onClick={handleToggleLocale}
            className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1.5 text-xs font-bold text-[var(--ui-foreground)] transition hover:bg-[var(--ui-surface-2)]"
          >
            {isAr ? "EN" : "AR"}
          </button>

          {user ? (
            <Link
              to={portalPath}
              className="hidden rounded-xl bg-[var(--color-primary-500)] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[var(--color-primary-900)] sm:inline-flex"
            >
              {t("dashboard", isAr ? "لوحة التحكم" : "Dashboard")}
            </Link>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-xl bg-[var(--color-primary-500)] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[var(--color-primary-900)] sm:inline-flex"
            >
              {t("login", isAr ? "تسجيل الدخول" : "Login")}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ui-border)] text-[var(--ui-foreground)] md:hidden"
          >
            {mobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-semibold ${
                    isActive
                      ? "bg-[var(--color-primary-500)] text-white"
                      : "text-[var(--ui-foreground)] hover:bg-[var(--ui-surface-2)]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to={user ? portalPath : "/login"}
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-xl bg-[var(--color-primary-500)] px-4 py-2.5 text-center text-sm font-bold text-white"
            >
              {user
                ? t("dashboard", isAr ? "لوحة التحكم" : "Dashboard")
                : t("login", isAr ? "تسجيل الدخول" : "Login")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

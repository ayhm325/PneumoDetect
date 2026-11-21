import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { applyDocumentDirection } from "@/i18n/config";
import { useAuth } from "@/stores/authStore";

export interface PortalNavItem {
  to: string;
  label: string;
}

interface PortalLayoutProps {
  title: string;
  navItems: PortalNavItem[];
}

export function PortalLayout({ title, navItems }: PortalLayoutProps) {
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const toggleLanguage = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
    applyDocumentDirection(next);
  };

  return (
    <div className="flex min-h-screen bg-[#eef7f1] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="hidden w-64 shrink-0 border-e border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 md:flex md:flex-col">
        <Link to="/" className="mb-6 text-xl font-extrabold text-sky-700 dark:text-sky-400">
          PneumoDetect
        </Link>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </p>
        <nav className="flex flex-1 flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 rounded-xl border border-red-200 px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          {i18n.language === "ar" ? "تسجيل الخروج" : "Logout"}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-5 py-3.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {user?.fullName || user?.email}
            </span>
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              {user?.role}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {i18n.language === "ar" ? "EN" : "AR"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 md:hidden"
            >
              {i18n.language === "ar" ? "خروج" : "Logout"}
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

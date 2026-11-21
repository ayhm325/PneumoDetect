import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaBars, FaMoon, FaSignOutAlt, FaSun, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { applyDocumentDirection } from "@/i18n/config";
import { useTheme } from "@/lib/compat/theme";
import { useAuth } from "@/stores/authStore";

export interface PortalNavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export interface UnifiedPortalShellProps {
  portalTitle: string;
  portalBadge: string;
  navItems: PortalNavItem[];
  children: React.ReactNode;
}

export function UnifiedPortalShell({
  portalTitle,
  portalBadge,
  navItems,
  children,
}: UnifiedPortalShellProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleLocale = () => {
    const next = isAr ? "en" : "ar";
    i18n.changeLanguage(next);
    applyDocumentDirection(next);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const renderNavLinks = (isCollapsed: boolean, onNavigate?: () => void) => (
    <nav className="flex flex-1 flex-col gap-1 px-2.5 py-3" aria-label={portalTitle}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          title={isCollapsed ? item.label : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[var(--color-primary-500)] text-white shadow-sm"
                : "text-[var(--ui-foreground)] hover:bg-[var(--ui-surface-2)]"
            } ${isCollapsed ? "justify-center px-2" : ""}`
          }
        >
          <span className="shrink-0 text-base">{item.icon}</span>
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[var(--ui-surface-2)] text-[var(--ui-foreground)]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-e border-[var(--ui-border)] bg-[var(--ui-surface)] transition-all duration-200 md:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--ui-border)] px-4">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2 font-extrabold text-[var(--color-primary-500)]">
              <span className="text-lg tracking-tight">PneumoDetect</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-lg p-2 text-[var(--ui-muted)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-foreground)]"
          >
            {collapsed ? (isAr ? <FaChevronLeft /> : <FaChevronRight />) : isAr ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 pt-4">
            <span className="inline-block rounded-full bg-[var(--color-primary-100)] px-3 py-1 text-xs font-bold text-[var(--color-primary-900)] dark:bg-[var(--color-primary-900)]/40 dark:text-[var(--color-primary-100)]">
              {portalBadge}
            </span>
          </div>
        )}

        {renderNavLinks(collapsed)}

        <div className="border-t border-[var(--ui-border)] p-3">
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 ${
              collapsed ? "justify-center px-2" : ""
            }`}
          >
            <FaSignOutAlt className="shrink-0" />
            {!collapsed && <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex w-72 max-w-[85vw] flex-col border-e border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-[var(--ui-border)] px-4">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="text-lg font-extrabold text-[var(--color-primary-500)]"
              >
                PneumoDetect
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-[var(--ui-muted)] hover:bg-[var(--ui-surface-2)]"
              >
                <FaTimes />
              </button>
            </div>
            <div className="px-4 pt-4">
              <span className="inline-block rounded-full bg-[var(--color-primary-100)] px-3 py-1 text-xs font-bold text-[var(--color-primary-900)]">
                {portalBadge}
              </span>
            </div>
            {renderNavLinks(false, () => setMobileOpen(false))}
            <div className="border-t border-[var(--ui-border)] p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <FaSignOutAlt />
                <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-surface)]/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg p-2 text-[var(--ui-foreground)] hover:bg-[var(--ui-surface-2)] md:hidden"
            >
              <FaBars />
            </button>
            <h2 className="text-sm font-bold text-[var(--ui-foreground)] sm:text-base">
              {portalTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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

            {user && (
              <div className="hidden items-center gap-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3 py-1.5 sm:flex">
                <span className="max-w-[140px] truncate text-xs font-semibold">
                  {user.fullName || user.email}
                </span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

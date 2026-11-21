import React, { createContext, useContext, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaBars,
  FaChevronDown,
  FaMoon,
  FaSignOutAlt,
  FaSun,
  FaTimes,
} from "react-icons/fa";
import { applyDocumentDirection } from "@/i18n/config";
import { useTheme } from "@/lib/compat/theme";
import { useAuth } from "@/stores/authStore";

export interface PortalSubmenuItem {
  to: string;
  label: string;
}

export interface PortalNavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  submenu?: PortalSubmenuItem[];
}

export interface UnifiedPortalShellProps {
  portalTitle: string;
  portalBadge: string;
  navItems: PortalNavItem[];
  children: React.ReactNode;
}

const PortalShellContext = createContext(false);

function SidebarNavItem({
  item,
  isOpen,
  isCollapsed,
  onToggle,
  onNavigate,
}: {
  item: PortalNavItem;
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const contentRef = useRef<HTMLUListElement | null>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    setHeight(
      isOpen && !isCollapsed
        ? contentRef.current.getBoundingClientRect().height
        : 0,
    );
  }, [isOpen, isCollapsed]);

  const isSubActive = Boolean(item.submenu?.some((s) => pathname === s.to));
  const isActive = pathname === item.to || isSubActive;

  if (!item.submenu || item.submenu.length === 0) {
    return (
      <li>
        <NavLink
          to={item.to}
          onClick={onNavigate}
          aria-label={isCollapsed ? item.label : undefined}
          title={isCollapsed ? item.label : undefined}
          className={({ isActive: linkActive }) =>
            `flex h-12 items-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
              isCollapsed ? "justify-center px-0" : "gap-3.5 px-4"
            } ${
              linkActive
                ? "bg-white/15 text-white shadow-xs"
                : "text-white/85 hover:bg-white/8 hover:text-white"
            }`
          }
        >
          <span className="shrink-0 text-base">{item.icon}</span>
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </NavLink>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-current={isActive ? "page" : undefined}
        aria-label={isCollapsed ? item.label : undefined}
        title={isCollapsed ? item.label : undefined}
        onClick={onToggle}
        className={`flex h-12 w-full items-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
          isCollapsed ? "justify-center px-0" : "gap-3.5 px-4"
        } ${
          isOpen || isActive
            ? "bg-white/15 text-white"
            : "text-white/85 hover:bg-white/8 hover:text-white"
        }`}
      >
        <span className="shrink-0 text-base">{item.icon}</span>
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate text-start">{item.label}</span>
            <FaChevronDown
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>

      <div
        className="relative overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height }}
      >
        <ul ref={contentRef} className="grid gap-0.5 py-1">
          {item.submenu.map((sub) => (
            <li key={sub.to}>
              <NavLink
                to={sub.to}
                onClick={onNavigate}
                className={({ isActive: subActive }) =>
                  `relative flex h-10 items-center rounded-lg ps-12 pe-3 text-xs font-medium transition before:absolute before:start-6 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full ${
                    subActive
                      ? "bg-white/12 text-white before:bg-sky-400"
                      : "text-white/75 before:bg-white/35 hover:bg-white/6 hover:text-white"
                  }`
                }
              >
                {sub.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function UnifiedPortalShell({
  portalTitle,
  portalBadge,
  navItems,
  children,
}: UnifiedPortalShellProps) {
  const isInsideShell = useContext(PortalShellContext);
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
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

  const handleItemToggle = (item: PortalNavItem) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenId(item.submenu ? item.to : null);
      return;
    }
    setOpenId((prev) => (prev === item.to ? null : item.to));
  };

  const sidebarSurfaceClass =
    "bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border border-white/10 text-white shadow-2xl backdrop-blur-xl";

  if (isInsideShell) {
    return <>{children}</>;
  }

  return (
    <PortalShellContext.Provider value={true}>
    <div className="flex min-h-screen bg-[var(--ui-surface-2)] text-[var(--ui-foreground)]">
      {/* Desktop Floating Rounded Sidebar */}
      <aside
        className={`hidden shrink-0 flex-col md:sticky md:top-4 md:m-4 md:flex md:h-[calc(100vh-2rem)] md:rounded-[30px] transition-[width,padding] duration-300 ease-in-out ${sidebarSurfaceClass} ${
          collapsed ? "w-[76px] px-2.5" : "w-[260px] px-4"
        }`}
      >
        <header
          className={`flex h-[72px] shrink-0 items-center gap-3 pt-2 ${
            collapsed ? "justify-center px-0" : "px-2"
          }`}
        >
          {!collapsed && (
            <Link
              to="/"
              className="truncate text-lg font-bold tracking-wide text-white/95"
            >
              PneumoDetect
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-sky-400 ${
              collapsed ? "mx-0" : "ms-auto"
            }`}
          >
            <FaBars className="h-4 w-4" />
          </button>
        </header>

        {!collapsed && (
          <div className="mb-2 px-2">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-sky-200">
              {portalBadge}
            </span>
          </div>
        )}

        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-1">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.to}
              item={item}
              isOpen={openId === item.to && !collapsed}
              isCollapsed={collapsed}
              onToggle={() => handleItemToggle(item)}
            />
          ))}

          <li className="mt-auto mb-3 pt-3">
            <button
              type="button"
              onClick={handleLogout}
              title={collapsed ? (isAr ? "تسجيل الخروج" : "Logout") : undefined}
              className={`flex h-12 w-full items-center rounded-xl text-sm font-semibold text-rose-300 transition hover:bg-rose-500/15 hover:text-rose-200 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                collapsed ? "justify-center px-0" : "gap-3.5 px-4"
              }`}
            >
              <FaSignOutAlt className="shrink-0 text-base" />
              {!collapsed && <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>}
            </button>
          </li>
        </ul>
      </aside>

      {/* Mobile Floating Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex p-3 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            className={`relative z-10 flex w-[270px] max-w-[85vw] flex-col rounded-[28px] px-4 ${sidebarSurfaceClass}`}
          >
            <header className="flex h-[72px] shrink-0 items-center justify-between px-2 pt-2">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="text-lg font-bold tracking-wide text-white/95"
              >
                PneumoDetect
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/10"
              >
                <FaTimes />
              </button>
            </header>

            <div className="mb-2 px-2">
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-sky-200">
                {portalBadge}
              </span>
            </div>

            <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-1">
              {navItems.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  item={item}
                  isOpen={openId === item.to}
                  isCollapsed={false}
                  onToggle={() => handleItemToggle(item)}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}

              <li className="mt-auto mb-3 pt-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-12 w-full items-center gap-3.5 rounded-xl px-4 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/15"
                >
                  <FaSignOutAlt />
                  <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>
                </button>
              </li>
            </ul>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-surface)]/90 px-4 backdrop-blur-md sm:px-6">
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
    </PortalShellContext.Provider>
  );
}

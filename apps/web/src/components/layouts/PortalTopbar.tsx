import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaHome,
  FaMoon,
  FaSignOutAlt,
  FaSun,
  FaUserCircle,
} from "react-icons/fa";
import type { AuthUser } from "@pneumodetect/contracts";
import type { PortalNavItem } from "./UnifiedPortalShell";
import { apiRequest } from "@/lib/apiClient";

export interface PortalTopbarProps {
  portalTitle: string;
  portalBadge?: string;
  navItems?: PortalNavItem[];
  isAr: boolean;
  isDark: boolean;
  user: AuthUser | null;
  onOpenMobileMenu: () => void;
  onToggleTheme: () => void;
  onToggleLocale: () => void;
  onLogout?: () => void;
}

function resolveActivePageLabel(navItems: PortalNavItem[] | undefined, pathname: string): string | null {
  if (!navItems || navItems.length === 0) return null;
  for (const item of navItems) {
    if (item.to === pathname) return item.label;
    if (item.submenu) {
      const sub = item.submenu.find((s) => s.to === pathname);
      if (sub) return sub.label;
    }
  }
  const prefixMatch = navItems.find(
    (item) => item.to !== "/" && pathname.startsWith(item.to + "/"),
  );
  return prefixMatch ? prefixMatch.label : null;
}

function getInitials(nameOrEmail?: string | null): string {
  const raw = String(nameOrEmail || "").trim();
  if (!raw) return "U";
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return raw.slice(0, 2).toUpperCase();
}

export function PortalTopbar({
  portalTitle,
  portalBadge,
  navItems,
  isAr,
  isDark,
  user,
  onOpenMobileMenu,
  onToggleTheme,
  onToggleLocale,
  onLogout,
}: PortalTopbarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const roleBase =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "doctor"
        ? "/doctor"
        : "/patient";

  const dashboardPath = `${roleBase}/dashboard`;
  const notificationsPath = `${roleBase}/notifications`;
  const profilePath = user?.role === "patient" ? "/patient/profile" : `${roleBase}/settings`;

  const currentPageLabel = useMemo(
    () => resolveActivePageLabel(navItems, pathname),
    [navItems, pathname],
  );

  // Fetch unread notification count and refresh on route change or notification events
  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadUnread = async () => {
      try {
        const data = await apiRequest<{
          notifications?: Array<{ isRead?: boolean; read?: boolean }>;
          unreadCount?: number;
        }>("/api/notifications");
        if (!active) return;
        const list = Array.isArray(data?.notifications)
          ? data.notifications
          : Array.isArray(data)
            ? data
            : [];
        const count =
          typeof data?.unreadCount === "number"
            ? data.unreadCount
            : list.filter((n: { isRead?: boolean; read?: boolean }) => !n.isRead && !n.read).length;
        if (active) setUnreadCount(count);
      } catch {
        // Ignore transient network errors
      }
    };

    loadUnread();
    const handleRefresh = () => void loadUnread();
    window.addEventListener("notifications:updated", handleRefresh);
    return () => {
      active = false;
      window.removeEventListener("notifications:updated", handleRefresh);
    };
  }, [user, pathname]);

  // Close user menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  const BreadcrumbSeparator = isAr ? FaChevronLeft : FaChevronRight;
  const displayName = user?.fullName || user?.email || (isAr ? "المستخدم" : "User");

  return (
    <header className="sticky top-3 z-30 mx-3 mt-3 flex h-[66px] items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[var(--ui-topbar-bg)]/95 px-4 text-white shadow-lg backdrop-blur-md sm:px-6 md:top-4 md:mx-4 md:mt-4">
      {/* Context & Breadcrumb Section */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label={isAr ? "فتح قائمة التنقل" : "Open navigation menu"}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 md:hidden"
        >
          <FaBars className="h-4 w-4" />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold tracking-wide text-white/90 sm:text-[15px]">
            {portalTitle}
          </span>
          {currentPageLabel && (
            <>
              <BreadcrumbSeparator className="h-2.5 w-2.5 shrink-0 text-sky-200/70" />
              <h1 className="truncate text-sm font-bold text-white sm:text-base">
                {currentPageLabel}
              </h1>
            </>
          )}
          {portalBadge && (
            <span className="hidden rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-sky-100 lg:inline-flex">
              {portalBadge}
            </span>
          )}
        </nav>
      </div>

      {/* Actions Section */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(notificationsPath)}
          aria-label={
            unreadCount > 0
              ? isAr
                ? `الإشعارات (${unreadCount} غير مقروءة)`
                : `Notifications (${unreadCount} unread)`
              : isAr
                ? "الإشعارات"
                : "Notifications"
          }
          title={isAr ? "الإشعارات" : "Notifications"}
          aria-current={pathname === notificationsPath ? "page" : undefined}
          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${
            pathname === notificationsPath
              ? "border-sky-300/60 bg-white/20 text-white"
              : "border-white/15 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
          }`}
        >
          <FaBell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -end-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-xs ring-2 ring-slate-900">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={
            isDark
              ? isAr
                ? "الوضع النهاري"
                : "Switch to light mode"
              : isAr
                ? "الوضع الليلي"
                : "Switch to dark mode"
          }
          title={
            isDark
              ? isAr
                ? "الوضع النهاري"
                : "Light mode"
              : isAr
                ? "الوضع الليلي"
                : "Dark mode"
          }
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          {isDark ? <FaSun className="h-4 w-4 text-amber-300" /> : <FaMoon className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onToggleLocale}
          aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-bold tracking-wide text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          {isAr ? "EN" : "AR"}
        </button>

        {user && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={displayName}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-2.5 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 sm:px-3"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-400/25 text-xs font-bold text-sky-100">
                {getInitials(displayName)}
              </span>
              <span className="hidden max-w-[130px] truncate text-sm font-medium sm:inline">
                {displayName}
              </span>
              <FaChevronDown
                className={`hidden h-3 w-3 shrink-0 text-white/75 transition-transform duration-200 sm:inline ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute end-0 mt-2 w-60 origin-top-end rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-2 text-[var(--ui-foreground)] shadow-2xl"
              >
                <div className="mb-1.5 border-b border-[var(--ui-border)] px-3 py-2">
                  <p className="truncate text-sm font-bold text-[var(--ui-foreground)]">
                    {displayName}
                  </p>
                  {user.email && (
                    <p className="truncate text-xs text-[var(--ui-muted)]">{user.email}</p>
                  )}
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(dashboardPath);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-sm font-medium transition hover:bg-[var(--ui-surface-2)]"
                >
                  <FaHome className="h-3.5 w-3.5 text-[var(--color-primary-500)]" />
                  <span>{isAr ? "لوحة التحكم" : "Dashboard"}</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(profilePath);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-sm font-medium transition hover:bg-[var(--ui-surface-2)]"
                >
                  {user.role === "patient" ? (
                    <FaUserCircle className="h-3.5 w-3.5 text-[var(--color-primary-500)]" />
                  ) : (
                    <FaCog className="h-3.5 w-3.5 text-[var(--color-primary-500)]" />
                  )}
                  <span>
                    {user.role === "patient"
                      ? isAr
                        ? "الملف الشخصي"
                        : "Profile"
                      : isAr
                        ? "الإعدادات"
                        : "Settings"}
                  </span>
                </button>

                {onLogout && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-xl border-t border-[var(--ui-border)] px-3 py-2 pt-2.5 text-start text-sm font-semibold text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400"
                  >
                    <FaSignOutAlt className="h-3.5 w-3.5" />
                    <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default PortalTopbar;

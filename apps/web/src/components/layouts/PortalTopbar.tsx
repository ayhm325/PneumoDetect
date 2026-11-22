import {
  BellIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleUserIcon,
  HouseIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { AuthUser } from "@pneumodetect/contracts";
import type { PortalNavItem } from "./UnifiedPortalShell";
import { apiRequest } from "@/lib/apiClient";
import { getInitials } from "@/lib/format";

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

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadUnread = async () => {
      try {
        const notifPath =
          user.role === "admin"
            ? "/api/admin/notifications"
            : user.role === "doctor"
              ? "/api/doctor/notifications"
              : "/api/patient/notifications";
        const data = await apiRequest<{
          notifications?: Array<{ isRead?: boolean; read?: boolean }>;
          unreadCount?: number;
        }>(notifPath);
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

  const BreadcrumbSeparator = isAr ? ChevronLeftIcon : ChevronRightIcon;
  const displayName = user?.fullName || user?.email || (isAr ? "المستخدم" : "User");

  return (
    <header className="shape-leaf sticky top-3 z-30 mx-3 mt-3 flex h-[66px] items-center justify-between gap-3 border border-[var(--pd-line)] bg-[var(--pd-surface)]/92 px-4 text-[var(--pd-text-primary)] shadow-[var(--pd-shadow-soft)] backdrop-blur-md sm:px-6 md:top-4 md:mx-4 md:mt-4">
      {/* Context & Breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label={isAr ? "فتح قائمة التنقل" : "Open navigation menu"}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] text-[var(--pd-text-primary)] transition-colors hover:bg-[var(--pd-surface-raised)] md:hidden"
        >
          <MenuIcon size={18} strokeWidth={1.7} />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-[var(--pd-text-muted)] sm:text-[15px]">
            {portalTitle}
          </span>
          {currentPageLabel && (
            <>
              <BreadcrumbSeparator size={14} strokeWidth={1.7} className="shrink-0 text-[var(--pd-text-subtle)]" />
              <span className="truncate text-sm font-semibold text-[var(--pd-text-primary)] sm:text-base">
                {currentPageLabel}
              </span>
            </>
          )}
          {portalBadge && (
            <span className="hidden rounded-full border border-[color-mix(in_srgb,var(--pd-orchid)_28%,transparent)] bg-[var(--pd-orchid-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--pd-orchid)] lg:inline-flex">
              {portalBadge}
            </span>
          )}
        </nav>
      </div>

      {/* Actions */}
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
          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
            pathname === notificationsPath
              ? "border-[color-mix(in_srgb,var(--pd-acid)_45%,transparent)] bg-[var(--pd-acid-soft)] text-[var(--pd-acid)]"
              : "border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] text-[var(--pd-text-secondary)] hover:border-[var(--pd-line-strong)] hover:text-[var(--pd-text-primary)]"
          }`}
        >
          <BellIcon size={17} strokeWidth={1.7} />
          {unreadCount > 0 && (
            <span className="pd-tabular absolute -top-1 -end-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--pd-coral)] px-1 text-[11px] font-semibold text-[var(--pd-on-accent)] ring-2 ring-[var(--pd-surface)]">
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
                ? "الوضع الدافئ"
                : "Switch to warm clay theme"
              : isAr
                ? "الوضع الليلي"
                : "Switch to night fig theme"
          }
          title={
            isDark
              ? isAr
                ? "الوضع الدافئ"
                : "Clay theme"
              : isAr
                ? "الوضع الليلي"
                : "Night Fig theme"
          }
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
          onClick={onToggleLocale}
          aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
          className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] px-3.5 text-xs font-medium tracking-wider text-[var(--pd-text-secondary)] transition-colors hover:border-[var(--pd-line-strong)] hover:text-[var(--pd-text-primary)]"
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
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] px-2 text-[var(--pd-text-primary)] transition-colors hover:border-[var(--pd-line-strong)] hover:bg-[var(--pd-surface-raised)] sm:pe-3"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--pd-acid-soft)] text-xs font-semibold text-[var(--pd-acid)]">
                {getInitials(displayName)}
              </span>
              <span className="hidden max-w-[130px] truncate text-sm font-medium text-[var(--pd-text-secondary)] sm:inline">
                {displayName}
              </span>
              <ChevronDownIcon
                size={14}
                strokeWidth={1.7}
                className={`hidden shrink-0 text-[var(--pd-text-muted)] transition-transform duration-200 sm:inline ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="pd-panel pd-panel--leaf pd-panel--raised absolute end-0 mt-2 w-60 origin-top-end p-2 shadow-[var(--pd-shadow-float)]"
              >
                <div className="mb-1.5 border-b border-[var(--pd-line)] px-3 py-2">
                  <p className="truncate text-sm font-semibold text-[var(--pd-text-primary)]">
                    {displayName}
                  </p>
                  {user.email && (
                    <p className="truncate text-xs text-[var(--pd-text-muted)]">{user.email}</p>
                  )}
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(dashboardPath);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[var(--shape-control)] px-3 py-2 text-start text-sm font-medium text-[var(--pd-text-secondary)] transition-colors hover:bg-[var(--pd-surface-hover)] hover:text-[var(--pd-text-primary)]"
                >
                  <HouseIcon size={15} strokeWidth={1.7} className="text-[var(--pd-acid)]" />
                  <span>{isAr ? "لوحة التحكم" : "Dashboard"}</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(profilePath);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[var(--shape-control)] px-3 py-2 text-start text-sm font-medium text-[var(--pd-text-secondary)] transition-colors hover:bg-[var(--pd-surface-hover)] hover:text-[var(--pd-text-primary)]"
                >
                  {user.role === "patient" ? (
                    <CircleUserIcon size={15} strokeWidth={1.7} className="text-[var(--pd-orchid)]" />
                  ) : (
                    <SettingsIcon size={15} strokeWidth={1.7} className="text-[var(--pd-orchid)]" />
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
                    className="mt-1 flex w-full items-center gap-2.5 rounded-[var(--shape-control)] border-t border-[var(--pd-line)] px-3 py-2 pt-2.5 text-start text-sm font-medium text-[var(--pd-coral)] transition-colors hover:bg-[var(--pd-coral-soft)]"
                  >
                    <LogOutIcon size={15} strokeWidth={1.7} />
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

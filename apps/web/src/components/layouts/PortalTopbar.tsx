import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaBell, FaMoon, FaSun, FaUserCircle } from "react-icons/fa";
import type { AuthUser } from "@pneumodetect/contracts";

export interface PortalTopbarProps {
  portalTitle: string;
  portalBadge?: string;
  isAr: boolean;
  isDark: boolean;
  user: AuthUser | null;
  onOpenMobileMenu: () => void;
  onToggleTheme: () => void;
  onToggleLocale: () => void;
}

export function PortalTopbar({
  portalTitle,
  portalBadge,
  isAr,
  isDark,
  user,
  onOpenMobileMenu,
  onToggleTheme,
  onToggleLocale,
}: PortalTopbarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const notificationsPath =
    user?.role === "admin"
      ? "/admin/notifications"
      : user?.role === "doctor"
        ? "/doctor/notifications"
        : "/patient/notifications";

  const profilePath =
    user?.role === "admin"
      ? "/admin/settings"
      : user?.role === "doctor"
        ? "/doctor/settings"
        : "/patient/profile";

  return (
    <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-white/10 bg-[var(--ui-topbar-bg)] px-4 text-white shadow-xs sm:px-6 lg:px-7">
      {/* Context Section */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label={isAr ? "فتح قائمة التنقل" : "Open navigation menu"}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 md:hidden"
        >
          <FaBars className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 items-center gap-2.5">
          <h2 className="truncate text-[15px] font-semibold tracking-wide text-white sm:text-base">
            {portalTitle}
          </h2>
          {portalBadge && (
            <span className="hidden rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-100 sm:inline-flex">
              {portalBadge}
            </span>
          )}
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={() => navigate(notificationsPath)}
          aria-label={isAr ? "الإشعارات" : "Notifications"}
          title={isAr ? "الإشعارات" : "Notifications"}
          aria-current={pathname === notificationsPath ? "page" : undefined}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-[10px] border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${
            pathname === notificationsPath
              ? "border-sky-300/60 bg-white/20 text-white"
              : "border-white/15 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
          }`}
        >
          <FaBell className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? (isAr ? "الوضع النهاري" : "Switch to light mode") : (isAr ? "الوضع الليلي" : "Switch to dark mode")}
          title={isDark ? (isAr ? "الوضع النهاري" : "Light mode") : (isAr ? "الوضع الليلي" : "Dark mode")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          {isDark ? <FaSun className="h-4 w-4 text-amber-300" /> : <FaMoon className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onToggleLocale}
          aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
          className="inline-flex h-10 items-center justify-center rounded-[10px] border border-white/15 bg-white/10 px-3 text-xs font-semibold tracking-wide text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          {isAr ? "EN" : "AR"}
        </button>

        {user && (
          <button
            type="button"
            onClick={() => navigate(profilePath)}
            title={user.fullName || user.email}
            className="hidden h-10 items-center gap-2 rounded-[10px] border border-white/15 bg-white/10 px-3 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 sm:inline-flex"
          >
            <FaUserCircle className="h-4 w-4 shrink-0 text-sky-200" />
            <span className="max-w-[150px] truncate text-[13px] font-semibold">
              {user.fullName || user.email}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
export default PortalTopbar;

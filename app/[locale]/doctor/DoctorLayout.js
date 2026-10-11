"use client";
export const dynamic = "force-dynamic";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FaUserAlt } from "react-icons/fa";
import { useTheme } from "../../theme-provider";
import { useLocaleContext } from "../../hooks/useLocaleContext";
import AuthGuard from "../../components/AuthGuard";
import useSocket from "../../components/chat/useSocket.client";

export default function DoctorLayout({
  children,
  doctorName = "",
  profileImage = "/default-doctor.png",
  breadcrumbs = [],
}) {
  const [collapsed, setCollapsed] = useState(false);
  const socket = useSocket();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toggleLocale } = useLocaleContext();
  const localeValue = useLocale();
  const locale = localeValue;
  const basePrefix = locale === "en" ? "/en" : "/ar";
  const isDark = theme === "dark";
  const t = useTranslations("doctorSidebar");
  const ui = useTranslations("ui");
  const navbar = useTranslations("navbar");

  // Global presence: connect socket as soon as doctor enters the app (no need to open chat page).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/token", { credentials: "include" });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.token) {
            try {
              socket.connect({ token: data.token });
            } catch (e) {
              try {
                socket.connect();
              } catch (e2) {}
            }
            return;
          }
        }
      } catch (e) {
        // ignore
      }
      try {
        socket.connect();
      } catch (e) {}
    })();

    return () => {
      mounted = false;
      try {
        socket.disconnect && socket.disconnect();
      } catch (e) {}
    };
  }, [socket]);

  // Navigation items
  const doctorNavItems = [
    {
      href: `${basePrefix}/doctor/dashboard`,
      label: t("dashboard"),
      icon: "🏠",
    },
    { href: `${basePrefix}/doctor/patients`, label: t("patients"), icon: "🧑‍⚕️" },
    { href: `${basePrefix}/doctor/results`, label: t("results"), icon: "📊" },
    { href: `${basePrefix}/doctor/chat`, label: t("chat"), icon: "💬" },
    {
      href: `${basePrefix}/doctor/appointments`,
      label: t("appointments"),
      icon: "📅",
    },
    {
      href: `${basePrefix}/doctor/settings`,
      label: t("settings"),
      icon: <FaUserAlt className="text-(--ui-info)" />,
    },
    { href: "__logout__", label: t("logout"), icon: "🚪" },
  ];

  const handleLogout = () => {
    router.push(`${basePrefix}/doctor/logout`);
  };

  return (
    <AuthGuard>
      <div
        className="min-h-screen bg-(--ui-surface-2) text-(--ui-foreground) flex"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {/* Sidebar */}
        <div
          className={`fixed ${locale === "ar" ? "right-0" : "left-0"} top-0 h-screen bg-(--ui-surface) border border-(--ui-border) shadow-(--shadow-lift) transition-all duration-300 z-50 ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-(--ui-border)">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 btn-gradient rounded-full blur opacity-40" />
                  <div className="relative flex items-center justify-center w-10 h-10 btn-gradient rounded-full shadow-(--shadow-soft)">
                    <span className="text-xl" aria-label={ui("aria.lungIcon")}>
                      🫁
                    </span>
                  </div>
                </div>
                <span className="font-black text-lg brand-gradient-text">
                  {navbar("brand")}
                </span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-(--ui-surface-2) rounded-lg transition-colors text-(--ui-muted-foreground) hover:text-(--ui-foreground)"
              title={collapsed ? t("ui.collapseOpen") : t("ui.collapseClose")}
            >
              {collapsed ? "←" : "→"}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {doctorNavItems.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                const isLogout = item.href === "__logout__";

                if (isLogout) {
                  return (
                    <button
                      key="logout"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-(--ui-muted-foreground) hover:text-(--ui-foreground) hover:bg-(--ui-danger-bg) transition-all"
                      title={collapsed ? item.label : ""}
                    >
                      <span className="text-lg shrink-0">{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      isActive
                        ? "btn-gradient text-white shadow-(--shadow-soft)"
                        : "text-(--ui-muted-foreground) hover:text-(--ui-foreground) hover:bg-(--ui-surface-2)"
                    }`}
                    title={collapsed ? item.label : ""}
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <span className="text-sm font-medium truncate">
                        {item.label}
                      </span>
                    )}
                  </a>
                );
              })}

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-(--ui-muted-foreground) hover:text-(--ui-foreground) hover:bg-(--ui-surface-2) transition-all w-full"
                title={
                  collapsed
                    ? isDark
                      ? t("ui.themeLight")
                      : t("ui.themeDark")
                    : ""
                }
              >
                <span className="text-lg shrink-0">{isDark ? "☀️" : "🌙"}</span>
                {!collapsed && (
                  <span className="text-sm font-medium">
                    {isDark ? t("ui.themeLight") : t("ui.themeDark")}
                  </span>
                )}
              </button>

              {/* Locale toggle */}
              <button
                onClick={toggleLocale}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-(--ui-muted-foreground) hover:text-(--ui-foreground) hover:bg-(--ui-surface-2) transition-all w-full"
                title={collapsed ? t("ui.localeSwitchLabel") : ""}
              >
                <span className="text-lg shrink-0">🌐</span>
                {!collapsed && (
                  <span className="text-sm font-medium">
                    {t("ui.localeSwitchLabel")}
                  </span>
                )}
              </button>
            </div>
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="border-t border-(--ui-border) p-3 text-xs text-(--ui-muted-foreground) space-y-1">
              <div>{t("ui.version", { version: "1.0.0" })}</div>
              <div>{t("ui.systemsOperational")}</div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ${
            locale === "ar"
              ? collapsed
                ? "mr-20"
                : "mr-64"
              : collapsed
                ? "ml-20"
                : "ml-64"
          }`}
        >
          <div className="min-h-screen">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}

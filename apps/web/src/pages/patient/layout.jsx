"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "@/lib/compat/Link";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import { usePathname, useRouter } from "@/lib/compat/navigation";
import { useTheme } from "@/lib/compat/theme";
import { useLocaleContext } from "@/contexts/LocaleContext";
import AuthGuard from "@/components/AuthGuard";
import useSocket from "@/components/chat/useSocket.client";
import { apiRequest } from "@/lib/apiClient";

export default function PatientLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const socket = useSocket();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { toggleLocale } = useLocaleContext();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const basePath = locale === "en" ? "/en" : "/ar";
  const t = useTranslations("patient");

  // Global presence: connect socket as soon as patient enters the app.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiRequest("/api/auth/token");
        if (!mounted) return;
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

  // Patient navigation items with translation
  const patientNavItems = [
    {
      href: `${basePath}/patient/dashboard`,
      label: t("nav.home"),
      icon: "🏠",
    },
    {
      href: `${basePath}/patient/appointments`,
      label: t("nav.appointments"),
      icon: "📅",
    },
    {
      href: `${basePath}/patient/analysis`,
      label: t("nav.analysis"),
      icon: "🔬",
    },
    {
      href: `${basePath}/patient/analysis/history`,
      label: t("nav.history"),
      icon: "📜",
    },
    {
      href: `${basePath}/patient/results`,
      label: t("nav.results"),
      icon: "📄",
    },
    {
      href: `${basePath}/patient/chat`,
      label: t("nav.chat"),
      icon: "💬",
    },
    {
      href: `${basePath}/patient/profile`,
      label: t("nav.profile"),
      icon: "👤",
    },
    {
      href: "__logout__",
      label: t("nav.logout"),
      icon: "🚪",
    },
  ];

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    router.push(`${basePath}/patient/logout`);
  };

  return (
    <AuthGuard>
      <div
        className="min-h-screen bg-(--ui-surface) text-(--ui-foreground) flex"
        dir={locale === "ar" ? "rtl" : "ltr"}
        style={
          isDark
            ? undefined
            : { backgroundColor: "#DFF2E5", ["--color-background"]: "#DFF2E5" }
        }
      >
        {/* Fixed Sidebar */}
        <div
          className={`fixed ${locale === "ar" ? "right-0 border-l" : "left-0 border-r"} top-0 h-screen bg-(--ui-surface) shadow-2xl transition-all duration-300 z-50 border-(--ui-border) ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-(--ui-border)">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-(--ui-ring) rounded-full blur opacity-30" />
                  <div className="relative flex items-center justify-center w-10 h-10 btn-gradient rounded-full shadow-lg">
                    <span className="text-xl" aria-label="Lung icon">
                      🫁
                    </span>
                  </div>
                </div>
                <span className="font-black text-lg brand-gradient-text">
                  {t("brand")}
                </span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-(--ui-surface-2)/50 rounded-lg transition-colors text-(--ui-muted-foreground) hover:text-(--ui-foreground)"
              title={
                collapsed
                  ? t("layout.sidebar.expandTitle")
                  : t("layout.sidebar.collapseTitle")
              }
            >
              {collapsed ? "←" : "→"}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {patientNavItems.map((item) => {
                const normalize = (p) =>
                  (p || "").replace(/\/+$|^\s+|\s+$/g, "");
                const np = normalize(pathname);
                const ih = normalize(item.href);
                // Prevent parent 'analysis' from matching child '/analysis/history'
                const isActive = (() => {
                  if (!np || !ih) return false;
                  if (item.href === `${basePath}/patient/analysis`) {
                    return np === ih;
                  }
                  return np === ih || np.startsWith(ih + "/");
                })();
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
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      isActive
                        ? "btn-gradient text-white"
                        : "text-(--ui-muted-foreground) hover:text-(--ui-foreground) hover:bg-(--ui-surface-2)/50"
                    }`}
                    title={collapsed ? item.label : ""}
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <span className="text-sm font-medium truncate">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-(--ui-muted-foreground) hover:text-(--ui-foreground) hover:bg-(--ui-surface-2)/50 transition-all w-full"
                title={
                  collapsed ? (isDark ? t("theme.light") : t("theme.dark")) : ""
                }
              >
                <span className="text-lg shrink-0">{isDark ? "☀️" : "🌙"}</span>
                {!collapsed && (
                  <span className="text-sm font-medium">
                    {isDark ? t("theme.light") : t("theme.dark")}
                  </span>
                )}
              </button>
              <button
                onClick={toggleLocale}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-(--ui-muted-foreground) hover:text-(--ui-foreground) hover:bg-(--ui-surface-2)/50 transition-all w-full"
                title={collapsed ? t("layout.localeSwitch.title") : ""}
              >
                <span className="text-lg shrink-0">🌐</span>
                {!collapsed && (
                  <span className="text-sm font-medium">
                    {t("layout.localeSwitch.label")}
                  </span>
                )}
              </button>
            </div>
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="border-t border-(--ui-border) p-3 text-xs text-(--ui-muted-foreground) space-y-1">
              <div>{t("version")}</div>
              <div>{t("status")}</div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ${
            collapsed
              ? locale === "ar"
                ? "mr-20"
                : "ml-20"
              : locale === "ar"
                ? "mr-64"
                : "ml-64"
          }`}
        >
          <div className="min-h-screen">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}
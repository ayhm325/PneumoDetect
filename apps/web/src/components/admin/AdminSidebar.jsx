"use client";

import { usePathname, useRouter } from "@/lib/compat/navigation";
import { useState } from "react";
import { useTheme } from "@/lib/compat/theme";
import { useLocaleContext } from "@/contexts/LocaleContext";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import { apiRequest } from "@/lib/apiClient";

export default function AdminSidebar({ collapsed, setCollapsed }) {
  // Removed unnecessary setMounted and useEffect
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { toggleLocale } = useLocaleContext();
  const t = useTranslations("adminSidebar");
  const ui = useTranslations("ui");
  const navbar = useTranslations("navbar");
  const locale = useLocale();
  const basePrefix = `/${locale}`;
  const isDark = theme === "dark";
  const router = useRouter();

  const handleLogoutClick = async () => {
    try {
      await apiRequest("/api/auth/logout", {
        method: "POST",
      }).catch(() => {});
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        sessionStorage.clear();
      }
      router.replace(basePrefix);
    }
  };
  // ...existing code...
  // Use t("key") for all navigation labels
  const items = [
    {
      href: `${basePrefix}/admin/dashboard`,
      label: t("nav.dashboard"),
      icon: "📊",
    },
    {
      href: `${basePrefix}/admin/users`,
      label: t("nav.users"),
      icon: "👥",
    },
    {
      href: `${basePrefix}/admin/patients`,
      label: t("nav.patients"),
      icon: "🧑‍🤝‍🧑",
    },
    {
      href: `${basePrefix}/admin/doctors`,
      label: t("nav.doctors"),
      icon: "🧑‍⚕️",
    },
    {
      href: `${basePrefix}/admin/doctor-change-requests-page`,
      label: t("nav.doctorChangeRequests"),
      icon: "📝",
    },

    {
      href: `${basePrefix}/admin/settings`,
      label: t("nav.settings"),
      icon: "⚙️",
    },
    {
      href: "__logout__",
      label: t("nav.logout"),
      icon: "🚪",
    },
  ];
  return (
    <div
      className={`fixed top-0 h-screen card-glass transition-all duration-300 z-50 ${collapsed ? "w-20" : "w-64"} ${locale === "ar" ? "right-0" : "left-0"} border-r border-(--ui-border)`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-(--ui-border)">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 brand-gradient rounded-full blur opacity-40" />
              <div className="relative flex items-center justify-center w-10 h-10 brand-gradient rounded-full shadow-(--shadow-soft)">
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
          className="p-2 hover:bg-(--ui-muted) rounded-lg transition-colors text-(--ui-muted-2) hover:text-foreground"
          title={collapsed ? t("ui.collapseOpen") : t("ui.collapseClose")}
        >
          {collapsed ? "←" : "→"}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {items.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const isLogout = item.href === "__logout__";
            if (isLogout) {
              return (
                <button
                  key="logout"
                  onClick={handleLogoutClick}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-(--ui-muted-2) hover:text-foreground hover:bg-(--ui-muted) transition-all ${collapsed ? "justify-center" : ""}`}
                  title={collapsed ? item.label : ""}
                >
                  <span className="text-lg shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
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
                    ? "brand-gradient text-white shadow-(--shadow-soft)"
                    : "text-(--ui-muted-2) hover:text-foreground hover:bg-(--ui-muted)"
                } ${collapsed ? "justify-center" : ""}`}
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
          {/* زر تبديل الوضع الليلي */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-(--ui-muted-2) hover:text-foreground hover:bg-(--ui-muted) transition-all w-full ${collapsed ? "justify-center" : ""}`}
            title={
              collapsed ? (isDark ? t("ui.themeLight") : t("ui.themeDark")) : ""
            }
          >
            <span className="text-lg shrink-0">{isDark ? "☀️" : "🌙"}</span>
            {!collapsed && (
              <span className="text-sm font-medium">
                {isDark ? t("ui.themeLight") : t("ui.themeDark")}
              </span>
            )}
          </button>
          {/* زر تبديل اللغة */}
          <button
            onClick={toggleLocale}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-(--ui-muted-2) hover:text-foreground hover:bg-(--ui-muted) transition-all w-full ${collapsed ? "justify-center" : ""}`}
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
        <div className="border-t border-(--ui-border) p-3 text-xs text-(--ui-muted-2) space-y-1">
          <div>{t("footer.version")}</div>
          <div>{t("footer.operational")}</div>
        </div>
      )}
    </div>
  );
}
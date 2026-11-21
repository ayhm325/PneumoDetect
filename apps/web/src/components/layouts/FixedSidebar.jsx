"use client";

import { useState } from "react";
import Link from "@/lib/compat/Link";
import { usePathname, useRouter } from "@/lib/compat/navigation";
import { useLocale, useTranslations } from "@/lib/compat/intl";

export default function FixedSidebar({ items = [], userRole = "patient" }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const ui = useTranslations("ui");
  const navbar = useTranslations("navbar");

  const buildPath = (targetLocale, path = pathname || "/") => {
    const clean = path.replace(/^\/(en|ar)/, "");
    const normalized = clean.startsWith("/") ? clean : `/${clean}`;
    return `/${targetLocale}${normalized}`;
  };

  const handleLogout = () => {
    router.push(buildPath(locale, "/login"));
  };

  return (
    <>
      {/* Fixed Sidebar Container */}
      <div
        className={`fixed left-0 top-0 h-screen bg-(--ui-surface) text-(--ui-foreground) border-r border-(--ui-border) shadow-2xl transition-all duration-300 z-50 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="absolute inset-0 -z-10 brand-gradient opacity-10" />
        {/* Header with Logo and Toggle */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-(--ui-border)">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {navbar("brandShort")}
                </span>
              </div>
              <span className="font-bold text-lg hidden lg:inline brand-gradient-text">
                {navbar("brand")}
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-(--ui-surface-2) rounded-lg transition-colors text-(--ui-muted-foreground) hover:text-(--ui-foreground)"
            title={collapsed ? ui("sidebar.expand") : ui("sidebar.collapse")}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {items.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              const isLogout = item.href === "__logout__";

              if (isLogout) {
                return (
                  <button
                    key="logout"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-(--ui-muted-foreground) hover:text-(--ui-foreground) hover:bg-(--ui-danger-bg) transition-all group"
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
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
                    isActive
                      ? "btn-gradient text-white shadow-lg"
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
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Info */}
        {!collapsed && (
          <div className="border-t border-(--ui-border) p-3 text-xs text-(--ui-muted-foreground) space-y-1">
            <div className="text-(--ui-muted-foreground)">
              {ui("footer.version")}
            </div>
            <div className="text-(--ui-muted-foreground)">
              {ui("footer.statusOnline")}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area - Adjusted for fixed sidebar */}
      <div
        className="main-content-wrapper transition-all duration-300"
        style={{ marginLeft: collapsed ? "80px" : "256px" }}
      />
    </>
  );
}
"use client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { usePathname } from "@/lib/compat/navigation";
import { useState } from "react";
import { useTheme } from "@/lib/compat/theme";
export default function AdminLayout({
  children,
  breadcrumbs,
  adminName,
  adminImage,
}) {
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "ar";
  const [collapsed, setCollapsed] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  // عرض الشريط الجانبي
  const sidebarWidth = collapsed ? 80 : 256; // w-20 أو w-64 بالبكسل
  const marginStyle =
    locale === "ar"
      ? { marginRight: `${sidebarWidth}px` }
      : { marginLeft: `${sidebarWidth}px` };
  return (
    <div
      data-testid="admin-shell"
      className="min-h-screen bg-background text-foreground"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          [locale === "ar" ? "right" : "left"]: 0,
          height: "100vh",
          width: `${sidebarWidth}px`,
          zIndex: 50,
        }}
      >
        <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>
      <div className="flex-1" style={marginStyle}>
        {children}
      </div>
    </div>
  );
}
"use client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useState } from "react";
import { usePathname } from "@/lib/compat/navigation";

export default function AdminShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const isRTL = pathname?.startsWith("/ar");
  // Sidebar width: collapsed = 5rem (80px), expanded = 16rem (256px)
  const sidebarWidth = collapsed ? 80 : 256;
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        className="transition-all duration-300 p-6 w-full"
        style={
          isRTL
            ? { marginRight: sidebarWidth, marginLeft: 0 }
            : { marginLeft: sidebarWidth, marginRight: 0 }
        }
      >
        {children}
      </main>
    </div>
  );
}
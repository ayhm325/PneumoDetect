"use client";

import { useState } from "react";
import FixedSidebar from "@/app/components/layouts/FixedSidebar";

export default function FixedSidebarLayout({
  children,
  sidebarItems = [],
  userRole = "patient",
  contentComponent = null,
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-(--ui-surface) text-(--ui-foreground)">
      {/* Fixed Sidebar */}
      <FixedSidebar
        items={sidebarItems}
        userRole={userRole}
        collapsed={collapsed}
      />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="min-h-screen">{contentComponent || children}</div>
      </div>
    </div>
  );
}

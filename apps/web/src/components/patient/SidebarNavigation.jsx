"use client";
import DashboardSidebarItem from "./sidebar/DashboardSidebarItem";
import AnalysisSidebarItem from "./sidebar/AnalysisSidebarItem";
import ResultsSidebarItem from "./sidebar/ResultsSidebarItem";
import ChatSidebarItem from "./sidebar/ChatSidebarItem";
import ProfileSidebarItem from "./sidebar/ProfileSidebarItem";
import LogoutSidebarItem from "./sidebar/LogoutSidebarItem";
import { useTheme } from "@/lib/compat/theme";
import { useTranslations } from "@/lib/compat/intl";

export default function SidebarNavigation() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const t = useTranslations("patient");

  return (
    <aside className="w-full md:w-60 bg-(--ui-surface) border-r border-(--ui-border) h-full flex flex-col p-4 gap-2">
      <nav className="flex flex-col gap-2">
        <DashboardSidebarItem />
        <AnalysisSidebarItem />
        <ResultsSidebarItem />
        <ChatSidebarItem />
        <ProfileSidebarItem />
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-(--ui-foreground) hover:bg-(--ui-surface-2)/60 transition-all"
          title={isDark ? t("theme.light") : t("theme.dark")}
        >
          <span className="text-xl">{isDark ? "☀️" : "🌙"}</span>
          <span className="text-sm font-medium">
            {isDark ? t("theme.light") : t("theme.dark")}
          </span>
        </button>
        <LogoutSidebarItem />
      </nav>
    </aside>
  );
}
"use client";

import Image from "@/lib/compat/Image";
import React from "react";
// ErrorMessage unified in ui/ErrorMessage.js
import DoctorChangeRequestsSidebarItem from "./sidebar/DoctorChangeRequestsSidebarItem";
import DashboardSidebarItem from "./sidebar/DashboardSidebarItem";
import UsersSidebarItem from "./sidebar/UsersSidebarItem";
import DoctorsSidebarItem from "./sidebar/DoctorsSidebarItem";
import PatientsSidebarItem from "./sidebar/PatientsSidebarItem";
import AnalysisSidebarItem from "./sidebar/AnalysisSidebarItem";
import ChatSidebarItem from "./sidebar/ChatSidebarItem";
import SettingsSidebarItem from "./sidebar/SettingsSidebarItem";
import LogoutSidebarItem from "./sidebar/LogoutSidebarItem";
// ConfirmDialog unified in ui/ConfirmDialog.js
import { useTheme } from "@/app/theme-provider";
import useLocale from "../../hooks/useLocale";
import { useTranslations } from "@/lib/compat/intl";

export default function SidebarNavigation() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const { locale, switchLocale } = useLocale();
  const t = useTranslations("adminSidebar.ui");
  const ui = useTranslations("ui");
  const navbar = useTranslations("navbar");
  return (
    <aside
      className={`w-full md:w-60 bg-(--color-background) border-r border-(--ui-border) h-full flex flex-col p-4 gap-2`}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* ???? PneumoDetect ?? ?????? ??????? */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex items-center justify-center w-10 h-10 brand-gradient rounded-full">
          <span className="text-xl" aria-label={ui("aria.lungIcon")}>
            ??
          </span>
        </div>
        <span className="font-black text-lg brand-gradient-text">
          {navbar("brand")}
        </span>
      </div>
      <nav className="flex flex-col gap-2">
        <DashboardSidebarItem />
        <UsersSidebarItem />
        <DoctorsSidebarItem />
        <PatientsSidebarItem />
        <DoctorChangeRequestsSidebarItem />
        <AnalysisSidebarItem />
        <ChatSidebarItem />
        <SettingsSidebarItem />
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex items-center gap-3 py-2.5 px-4 rounded-xl font-bold text-(--color-text) hover:bg-(--ui-surface) transition group"
          title={t(isDark ? "themeLight" : "themeDark")}
        >
          <span className="text-xl">{isDark ? "??" : "??"}</span>
          <span className="text-base font-bold">
            {t(isDark ? "themeLight" : "themeDark")}
          </span>
        </button>
        <button
          onClick={switchLocale}
          className="flex items-center gap-3 py-2.5 px-4 rounded-xl font-bold text-(--color-text) hover:bg-(--ui-surface) transition group"
          title={t("localeSwitchLabel")}
        >
          <span className="text-xl">??</span>
          <span className="text-base font-bold">{t("localeSwitchLabel")}</span>
        </button>
        <LogoutSidebarItem />
      </nav>
    </aside>
  );
}

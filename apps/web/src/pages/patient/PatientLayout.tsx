import { BellIcon, CalendarDaysIcon, FileHeartIcon, HistoryIcon, HouseIcon, MessagesSquareIcon, ScanLineIcon, UserIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { UnifiedPortalShell } from "@/components/layouts/UnifiedPortalShell";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation("patientSidebar");
  const isAr = i18n.language === "ar";

  const navItems = [
    { to: "/patient/dashboard", label: t("dashboard", isAr ? "لوحة التحكم" : "Dashboard"), icon: <HouseIcon /> },
    { to: "/patient/analysis", label: t("analysis", isAr ? "تحليل الأشعة" : "X-Ray Analysis"), icon: <ScanLineIcon /> },
    { to: "/patient/analysis/history", label: t("history", isAr ? "سجل التحليلات" : "History"), icon: <HistoryIcon /> },
    { to: "/patient/results", label: t("results", isAr ? "النتائج الطبية" : "Results"), icon: <FileHeartIcon /> },
    { to: "/patient/appointments", label: t("appointments", isAr ? "المواعيد" : "Appointments"), icon: <CalendarDaysIcon /> },
    { to: "/patient/chat", label: t("chat", isAr ? "المحادثة" : "Chat"), icon: <MessagesSquareIcon /> },
    { to: "/patient/notifications", label: t("notifications", isAr ? "الإشعارات" : "Notifications"), icon: <BellIcon /> },
    { to: "/patient/profile", label: t("profile", isAr ? "الملف الشخصي" : "Profile"), icon: <UserIcon /> },
  ];

  return (
    <UnifiedPortalShell
      portalTitle={isAr ? "بوابة المريض" : "Patient Portal"}
      portalBadge={isAr ? "حساب مريض" : "Patient"}
      navItems={navItems}
    >
      {children}
    </UnifiedPortalShell>
  );
}

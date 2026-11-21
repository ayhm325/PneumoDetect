import React from "react";
import {
  FaCalendarAlt,
  FaComments,
  FaFileMedicalAlt,
  FaHistory,
  FaHome,
  FaBell,
  FaUser,
  FaXRay,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { UnifiedPortalShell } from "@/components/layouts/UnifiedPortalShell";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation("patientSidebar");
  const isAr = i18n.language === "ar";

  const navItems = [
    { to: "/patient/dashboard", label: t("dashboard", isAr ? "لوحة التحكم" : "Dashboard"), icon: <FaHome /> },
    { to: "/patient/analysis", label: t("analysis", isAr ? "تحليل الأشعة" : "X-Ray Analysis"), icon: <FaXRay /> },
    { to: "/patient/analysis/history", label: t("history", isAr ? "سجل التحليلات" : "History"), icon: <FaHistory /> },
    { to: "/patient/results", label: t("results", isAr ? "النتائج الطبية" : "Results"), icon: <FaFileMedicalAlt /> },
    { to: "/patient/appointments", label: t("appointments", isAr ? "المواعيد" : "Appointments"), icon: <FaCalendarAlt /> },
    { to: "/patient/chat", label: t("chat", isAr ? "المحادثة" : "Chat"), icon: <FaComments /> },
    { to: "/patient/notifications", label: t("notifications", isAr ? "الإشعارات" : "Notifications"), icon: <FaBell /> },
    { to: "/patient/profile", label: t("profile", isAr ? "الملف الشخصي" : "Profile"), icon: <FaUser /> },
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

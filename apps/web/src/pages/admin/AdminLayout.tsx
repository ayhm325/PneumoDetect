import React from "react";
import {
  FaBell,
  FaCog,
  FaExchangeAlt,
  FaHome,
  FaUserInjured,
  FaUserMd,
  FaUsers,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { UnifiedPortalShell } from "@/components/layouts/UnifiedPortalShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation("adminSidebar");
  const isAr = i18n.language === "ar";

  const navItems = [
    { to: "/admin/dashboard", label: t("dashboard", isAr ? "لوحة التحكم" : "Dashboard"), icon: <FaHome /> },
    { to: "/admin/users", label: t("users", isAr ? "المستخدمون" : "Users"), icon: <FaUsers /> },
    { to: "/admin/doctors", label: t("doctors", isAr ? "الأطباء" : "Doctors"), icon: <FaUserMd /> },
    { to: "/admin/patients", label: t("patients", isAr ? "المرضى" : "Patients"), icon: <FaUserInjured /> },
    {
      to: "/admin/doctor-change-requests",
      label: t("changeRequests", isAr ? "طلبات تغيير الطبيب" : "Change Requests"),
      icon: <FaExchangeAlt />,
    },
    { to: "/admin/notifications", label: t("notifications", isAr ? "الإشعارات" : "Notifications"), icon: <FaBell /> },
    { to: "/admin/settings", label: t("settings", isAr ? "الإعدادات" : "Settings"), icon: <FaCog /> },
  ];

  return (
    <UnifiedPortalShell
      portalTitle={isAr ? "لوحة الإدارة" : "Admin Portal"}
      portalBadge={isAr ? "مشرف النظام" : "Admin"}
      navItems={navItems}
    >
      {children}
    </UnifiedPortalShell>
  );
}

import { ArrowLeftRightIcon, BellIcon, BriefcaseMedicalIcon, HouseIcon, SettingsIcon, UserRoundIcon, UsersIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { UnifiedPortalShell } from "@/components/layouts/UnifiedPortalShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation("adminSidebar");
  const isAr = i18n.language === "ar";

  const navItems = [
    { to: "/admin/dashboard", label: t("dashboard", isAr ? "لوحة التحكم" : "Dashboard"), icon: <HouseIcon /> },
    { to: "/admin/users", label: t("users", isAr ? "المستخدمون" : "Users"), icon: <UsersIcon /> },
    { to: "/admin/doctors", label: t("doctors", isAr ? "الأطباء" : "Doctors"), icon: <BriefcaseMedicalIcon /> },
    { to: "/admin/patients", label: t("patients", isAr ? "المرضى" : "Patients"), icon: <UserRoundIcon /> },
    {
      to: "/admin/doctor-change-requests",
      label: t("changeRequests", isAr ? "طلبات تغيير الطبيب" : "Change Requests"),
      icon: <ArrowLeftRightIcon />,
    },
    { to: "/admin/notifications", label: t("notifications", isAr ? "الإشعارات" : "Notifications"), icon: <BellIcon /> },
    { to: "/admin/settings", label: t("settings", isAr ? "الإعدادات" : "Settings"), icon: <SettingsIcon /> },
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

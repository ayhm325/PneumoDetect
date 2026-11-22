import { BellIcon, CalendarDaysIcon, ChartColumnIcon, FileHeartIcon, HouseIcon, MessagesSquareIcon, ScanLineIcon, SettingsIcon, UserRoundIcon } from "lucide-react";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { UnifiedPortalShell } from "@/components/layouts/UnifiedPortalShell";
import useSocket from "@/components/chat/useSocket.client";
import { apiRequest } from "@/lib/apiClient";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation("doctorSidebar");
  const isAr = i18n.language === "ar";
  const socket = useSocket();

  // Preserve global presence connection when doctor enters the portal
  useEffect(() => {
    let mounted = true;
    apiRequest<{ token?: string }>("/api/auth/token")
      .then((data) => {
        if (mounted && data?.token) {
          socket.connect({ token: data.token });
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [socket]);

  const navItems = [
    { to: "/doctor/dashboard", label: t("dashboard", isAr ? "لوحة التحكم" : "Dashboard"), icon: <HouseIcon /> },
    { to: "/doctor/patients", label: t("patients", isAr ? "المرضى" : "Patients"), icon: <UserRoundIcon /> },
    { to: "/doctor/upload-xray", label: t("uploadXray", isAr ? "رفع أشعة" : "Upload X-Ray"), icon: <ScanLineIcon /> },
    { to: "/doctor/results", label: t("results", isAr ? "النتائج" : "Results"), icon: <FileHeartIcon /> },
    { to: "/doctor/appointments", label: t("appointments", isAr ? "المواعيد" : "Appointments"), icon: <CalendarDaysIcon /> },
    { to: "/doctor/analytics", label: t("analytics", isAr ? "التحليلات" : "Analytics"), icon: <ChartColumnIcon /> },
    { to: "/doctor/chat", label: t("chat", isAr ? "المحادثة" : "Chat"), icon: <MessagesSquareIcon /> },
    { to: "/doctor/notifications", label: t("notifications", isAr ? "الإشعارات" : "Notifications"), icon: <BellIcon /> },
    { to: "/doctor/settings", label: t("settings", isAr ? "الإعدادات" : "Settings"), icon: <SettingsIcon /> },
  ];

  return (
    <UnifiedPortalShell
      portalTitle={isAr ? "بوابة الطبيب" : "Doctor Portal"}
      portalBadge={isAr ? "حساب طبيب" : "Doctor"}
      navItems={navItems}
    >
      {children}
    </UnifiedPortalShell>
  );
}

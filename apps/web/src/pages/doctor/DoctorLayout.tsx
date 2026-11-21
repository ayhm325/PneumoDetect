import React, { useEffect } from "react";
import {
  FaBell,
  FaCalendarAlt,
  FaChartBar,
  FaCog,
  FaComments,
  FaFileMedical,
  FaHome,
  FaUserInjured,
  FaXRay,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { UnifiedPortalShell } from "@/components/layouts/UnifiedPortalShell";
import useSocket from "@/components/chat/useSocket.client";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation("doctorSidebar");
  const isAr = i18n.language === "ar";
  const socket = useSocket();

  // Preserve global presence connection when doctor enters the portal
  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/token", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
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
    { to: "/doctor/dashboard", label: t("dashboard", isAr ? "لوحة التحكم" : "Dashboard"), icon: <FaHome /> },
    { to: "/doctor/patients", label: t("patients", isAr ? "المرضى" : "Patients"), icon: <FaUserInjured /> },
    { to: "/doctor/upload-xray", label: t("uploadXray", isAr ? "رفع أشعة" : "Upload X-Ray"), icon: <FaXRay /> },
    { to: "/doctor/results", label: t("results", isAr ? "النتائج" : "Results"), icon: <FaFileMedical /> },
    { to: "/doctor/appointments", label: t("appointments", isAr ? "المواعيد" : "Appointments"), icon: <FaCalendarAlt /> },
    { to: "/doctor/analytics", label: t("analytics", isAr ? "التحليلات" : "Analytics"), icon: <FaChartBar /> },
    { to: "/doctor/chat", label: t("chat", isAr ? "المحادثة" : "Chat"), icon: <FaComments /> },
    { to: "/doctor/notifications", label: t("notifications", isAr ? "الإشعارات" : "Notifications"), icon: <FaBell /> },
    { to: "/doctor/settings", label: t("settings", isAr ? "الإعدادات" : "Settings"), icon: <FaCog /> },
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

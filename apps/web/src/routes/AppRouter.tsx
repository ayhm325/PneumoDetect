import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PublicLayout } from "@/layouts/PublicLayout";
import { PortalLayout } from "@/layouts/PortalLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  AboutPage,
  BlogPage,
  ContactPage,
  FaqPage,
  HomePage,
  PrivacyPage,
  ServicesPage,
  TermsPage,
} from "@/features/public/PublicPages";
import { LoginPage } from "@/features/auth/LoginPage";
import { ForgotPasswordPage, SignupPage } from "@/features/auth/SignupPage";
import { AnalysisPage } from "@/features/analysis/AnalysisPage";
import { AnalysisHistoryPage } from "@/features/analysis/AnalysisHistoryPage";
import { ChatPage } from "@/features/chat/ChatPage";
import {
  PatientAppointmentsPage,
  PatientDashboardPage,
  PatientNotificationsPage,
  PatientProfilePage,
  PatientResultsPage,
} from "@/features/patient/PatientPages";
import {
  DoctorAppointmentsPage,
  DoctorDashboardPage,
  DoctorNotificationsPage,
  DoctorPatientsPage,
  DoctorResultsPage,
  DoctorSettingsPage,
} from "@/features/doctor/DoctorPages";
import {
  AdminChangeRequestsPage,
  AdminDashboardPage,
  AdminDoctorsPage,
  AdminNotificationsPage,
  AdminPatientsPage,
  AdminSettingsPage,
  AdminUsersPage,
} from "@/features/admin/AdminPages";

export function AppRouter() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PortalLayout
              title={isAr ? "بوابة المريض" : "Patient Portal"}
              navItems={[
                { to: "/patient/dashboard", label: isAr ? "الرئيسية" : "Dashboard" },
                { to: "/patient/analysis", label: isAr ? "تحليل أشعة" : "X-Ray Analysis" },
                { to: "/patient/analysis/history", label: isAr ? "سجل التحليلات" : "Analysis History" },
                { to: "/patient/results", label: isAr ? "النتائج الطبية" : "Results" },
                { to: "/patient/appointments", label: isAr ? "المواعيد" : "Appointments" },
                { to: "/patient/chat", label: isAr ? "المحادثة" : "Chat" },
                { to: "/patient/notifications", label: isAr ? "الإشعارات" : "Notifications" },
                { to: "/patient/profile", label: isAr ? "الملف الشخصي" : "Profile" },
              ]}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboardPage />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="analysis/history" element={<AnalysisHistoryPage />} />
        <Route path="results" element={<PatientResultsPage />} />
        <Route path="appointments" element={<PatientAppointmentsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="notifications" element={<PatientNotificationsPage />} />
        <Route path="profile" element={<PatientProfilePage />} />
      </Route>

      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <PortalLayout
              title={isAr ? "بوابة الطبيب" : "Doctor Portal"}
              navItems={[
                { to: "/doctor/dashboard", label: isAr ? "الرئيسية" : "Dashboard" },
                { to: "/doctor/patients", label: isAr ? "المرضى" : "Patients" },
                { to: "/doctor/upload-xray", label: isAr ? "تحليل أشعة" : "Upload X-Ray" },
                { to: "/doctor/results", label: isAr ? "النتائج" : "Results" },
                { to: "/doctor/appointments", label: isAr ? "المواعيد" : "Appointments" },
                { to: "/doctor/chat", label: isAr ? "المحادثة" : "Chat" },
                { to: "/doctor/notifications", label: isAr ? "الإشعارات" : "Notifications" },
                { to: "/doctor/settings", label: isAr ? "الإعدادات" : "Settings" },
              ]}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboardPage />} />
        <Route path="patients" element={<DoctorPatientsPage />} />
        <Route path="upload-xray" element={<AnalysisPage />} />
        <Route path="results" element={<DoctorResultsPage />} />
        <Route path="appointments" element={<DoctorAppointmentsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="notifications" element={<DoctorNotificationsPage />} />
        <Route path="settings" element={<DoctorSettingsPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <PortalLayout
              title={isAr ? "بوابة الإدارة" : "Admin Portal"}
              navItems={[
                { to: "/admin/dashboard", label: isAr ? "الرئيسية" : "Dashboard" },
                { to: "/admin/users", label: isAr ? "المستخدمون" : "Users" },
                { to: "/admin/doctors", label: isAr ? "الأطباء" : "Doctors" },
                { to: "/admin/patients", label: isAr ? "المرضى" : "Patients" },
                { to: "/admin/doctor-change-requests", label: isAr ? "طلبات تغيير الطبيب" : "Change Requests" },
                { to: "/admin/notifications", label: isAr ? "الإشعارات" : "Notifications" },
                { to: "/admin/settings", label: isAr ? "الإعدادات" : "Settings" },
              ]}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="doctors" element={<AdminDoctorsPage />} />
        <Route path="patients" element={<AdminPatientsPage />} />
        <Route path="doctor-change-requests" element={<AdminChangeRequestsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Legacy locale-prefixed redirects */}
      <Route path="/ar/*" element={<Navigate to="/" replace />} />
      <Route path="/en/*" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import React, { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PublicLayout } from "@/layouts/PublicLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingState } from "@/components/ui/StateViews";
import {
  ContactPage,
  FaqPage,
  HomePage,
} from "@/features/public/PublicPages";

// Public & Auth restored pages
const AboutPage = lazy(() => import("@/pages/about/page"));
const ServicesPage = lazy(() => import("@/pages/services/page"));
const BlogPage = lazy(() => import("@/pages/blog/page"));
const PrivacyPage = lazy(() => import("@/pages/privacy/page"));
const TermsPage = lazy(() => import("@/pages/terms/page"));
const LoginPage = lazy(() => import("@/pages/login/page"));
const SignUpPage = lazy(() => import("@/pages/signup/page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password/page"));

// Portal Layouts (original)
const PatientLayout = lazy(() => import("@/pages/patient/PatientLayout"));
const DoctorLayout = lazy(() => import("@/pages/doctor/DoctorLayout"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));

// Patient Pages (original)
const PatientDashboardPage = lazy(() => import("@/pages/patient/dashboard/page"));
const PatientAnalysisPage = lazy(() => import("@/pages/patient/analysis/page"));
const PatientAnalysisHistoryPage = lazy(() => import("@/pages/patient/analysis/history/page"));
const PatientResultsPage = lazy(() => import("@/pages/patient/results/page"));
const PatientAppointmentsPage = lazy(() => import("@/pages/patient/appointments/page"));
const PatientChatPage = lazy(() => import("@/pages/patient/chat/page"));
const PatientNotificationsPage = lazy(() => import("@/pages/patient/notifications/page"));
const PatientProfilePage = lazy(() => import("@/pages/patient/profile/page"));

// Doctor Pages (original)
const DoctorDashboardPage = lazy(() => import("@/pages/doctor/dashboard/DashboardHome"));
const DoctorPatientsPage = lazy(() => import("@/pages/doctor/patients/page"));
const DoctorUploadXrayPage = lazy(() => import("@/pages/doctor/upload-xray/page"));
const DoctorResultsPage = lazy(() => import("@/pages/doctor/results/page"));
const DoctorAnalyticsPage = lazy(() => import("@/pages/doctor/analytics/page"));
const DoctorAppointmentsPage = lazy(() => import("@/pages/doctor/appointments/page"));
const DoctorChatPage = lazy(() => import("@/pages/doctor/chat/page"));
const DoctorNotificationsPage = lazy(() => import("@/pages/doctor/notifications/page"));
const DoctorSettingsPage = lazy(() => import("@/pages/doctor/settings/page"));

// Admin Pages (original)
const AdminDashboardPage = lazy(() => import("@/pages/admin/dashboard/page"));
const AdminUsersPage = lazy(() => import("@/pages/admin/users/page"));
const AdminDoctorsPage = lazy(() => import("@/pages/admin/doctors/page"));
const AdminPatientsPage = lazy(() => import("@/pages/admin/patients/page"));
const AdminChangeRequestsPage = lazy(() => import("@/pages/admin/doctor-change-requests-page/page"));
const AdminNotificationsPage = lazy(() => import("@/pages/admin/notifications/page"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/settings/page"));

function LayoutOutlet({
  Layout,
}: {
  Layout: React.LazyExoticComponent<React.ComponentType<any>>;
}) {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export function AppRouter() {
  const { i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en" : "ar";
  return (
    <Suspense fallback={<LoadingState />}>
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
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <LayoutOutlet Layout={PatientLayout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PatientDashboardPage />} />
          <Route path="analysis" element={<PatientAnalysisPage />} />
          <Route path="analysis/history" element={<PatientAnalysisHistoryPage />} />
          <Route path="results" element={<PatientResultsPage />} />
          <Route path="appointments" element={<PatientAppointmentsPage />} />
          <Route path="chat" element={<PatientChatPage />} />
          <Route path="notifications" element={<PatientNotificationsPage />} />
          <Route path="profile" element={<PatientProfilePage />} />
        </Route>

        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <LayoutOutlet Layout={DoctorLayout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboardPage />} />
          <Route path="patients" element={<DoctorPatientsPage locale={locale} />} />
          <Route path="upload-xray" element={<DoctorUploadXrayPage />} />
          <Route path="results" element={<DoctorResultsPage />} />
          <Route path="analytics" element={<DoctorAnalyticsPage />} />
          <Route path="appointments" element={<DoctorAppointmentsPage />} />
          <Route path="chat" element={<DoctorChatPage />} />
          <Route path="notifications" element={<DoctorNotificationsPage />} />
          <Route path="settings" element={<DoctorSettingsPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <LayoutOutlet Layout={AdminLayout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="doctors" element={<AdminDoctorsPage />} />
          <Route path="patients" element={<AdminPatientsPage />} />
          <Route path="doctor-change-requests" element={<AdminChangeRequestsPage />} />
          <Route path="doctor-change-requests-page" element={<AdminChangeRequestsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="/ar/*" element={<Navigate to="/" replace />} />
        <Route path="/en/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/apiClient";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";

export function DoctorDashboardPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data: me, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["doctor", "me"],
    queryFn: () => apiRequest<Record<string, unknown>>("/api/doctor/me"),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{isAr ? "لوحة تحكم الطبيب" : "Doctor Dashboard"}</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {isAr ? "مرحباً د." : "Welcome Dr."} {String((me?.doctor as Record<string, unknown>)?.fullName || me?.fullName || "")}
        </p>
      </div>
    </div>
  );
}

export function DoctorPatientsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["doctor", "patients"],
    queryFn: () => apiRequest<{ patients?: Record<string, unknown>[] } | Record<string, unknown>[]>("/api/doctor/patients"),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const list = Array.isArray(data) ? data : data?.patients || [];
  if (list.length === 0) return <EmptyState title={isAr ? "لا يوجد مرضى مسجلون" : "No patients assigned"} />;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">{isAr ? "المرضى" : "Patients"}</h1>
      {list.map((p, idx) => (
        <div key={String(p.id || idx)} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-bold">{String(p.fullName || p.name || p.email || "Patient")}</p>
          <p className="text-xs text-slate-500">{String(p.clinicalStatus || p.status || "")}</p>
        </div>
      ))}
    </div>
  );
}

export function DoctorResultsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["doctor", "results"],
    queryFn: () => apiRequest<{ results?: Record<string, unknown>[] } | Record<string, unknown>[]>("/api/doctor/results"),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const list = Array.isArray(data) ? data : data?.results || [];
  if (list.length === 0) return <EmptyState title={isAr ? "لا توجد نتائج" : "No results"} />;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">{isAr ? "نتائج الفحوصات" : "Scan Results"}</h1>
      {list.map((r, idx) => (
        <div key={String(r.id || idx)} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-bold">{String(r.prediction || "Result")}</p>
        </div>
      ))}
    </div>
  );
}

export function DoctorAppointmentsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["doctor", "appointments"],
    queryFn: () => apiRequest<{ appointments?: Record<string, unknown>[] } | Record<string, unknown>[]>("/api/doctor/appointments"),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const list = Array.isArray(data) ? data : data?.appointments || [];
  if (list.length === 0) return <EmptyState title={isAr ? "لا توجد مواعيد" : "No appointments"} />;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">{isAr ? "مواعيد الطبيب" : "Appointments"}</h1>
      {list.map((a, idx) => (
        <div key={String(a.id || idx)} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-semibold">{String(a.reason || a.status || "Appointment")}</p>
          <p className="text-xs text-slate-500">{String(a.scheduledAt || "")}</p>
        </div>
      ))}
    </div>
  );
}

export function DoctorNotificationsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["doctor", "notifications"],
    queryFn: () => apiRequest<{ notifications?: Record<string, unknown>[] } | Record<string, unknown>[]>("/api/doctor/notifications"),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const list = Array.isArray(data) ? data : data?.notifications || [];
  if (list.length === 0) return <EmptyState title={isAr ? "لا توجد إشعارات" : "No notifications"} />;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">{isAr ? "الإشعارات" : "Notifications"}</h1>
      {list.map((n, idx) => (
        <div key={String(n.id || idx)} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm">{String(n.message || "")}</p>
        </div>
      ))}
    </div>
  );
}

export function DoctorSettingsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-xl font-bold">{isAr ? "إعدادات الطبيب" : "Doctor Settings"}</h1>
    </div>
  );
}

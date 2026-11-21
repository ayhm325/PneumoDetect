import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/apiClient";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";

export function PatientDashboardPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["patient", "dashboard-stats"],
    queryFn: () => apiRequest<Record<string, unknown>>("/api/patient/dashboard-stats"),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{isAr ? "لوحة تحكم المريض" : "Patient Dashboard"}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">{isAr ? "الفحوصات" : "Total Scans"}</p>
          <p className="mt-2 text-2xl font-extrabold text-sky-600">{String(data?.totalScans ?? data?.scansCount ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">{isAr ? "المواعيد القادمة" : "Upcoming Appointments"}</p>
          <p className="mt-2 text-2xl font-extrabold text-teal-600">{String(data?.upcomingAppointments ?? data?.appointmentsCount ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">{isAr ? "الإشعارات غير المقروءة" : "Unread Notifications"}</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">{String(data?.unreadNotifications ?? 0)}</p>
        </div>
      </div>
    </div>
  );
}

export function PatientResultsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["patient", "results"],
    queryFn: () => apiRequest<{ results?: Record<string, unknown>[] } | Record<string, unknown>[]>("/api/patient/results"),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const list = Array.isArray(data) ? data : data?.results || [];
  if (list.length === 0) return <EmptyState title={isAr ? "لا توجد نتائج طبية بعد" : "No medical results yet"} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{isAr ? "النتائج الطبية" : "Medical Results"}</h1>
      <div className="space-y-3">
        {list.map((r, idx) => (
          <div key={String(r.id || idx)} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="font-bold">{String(r.prediction || r.title || "Scan Result")}</p>
            <p className="text-xs text-slate-500">{String(r.notes || r.clinicalStatus || "")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PatientAppointmentsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const queryClient = useQueryClient();
  const [scheduledAt, setScheduledAt] = useState("");
  const [reason, setReason] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["patient", "appointments"],
    queryFn: () => apiRequest<{ appointments?: Record<string, unknown>[] } | Record<string, unknown>[]>("/api/patient/appointments"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/patient/appointments", {
        method: "POST",
        body: JSON.stringify({ scheduledAt, reason }),
      }),
    onSuccess: () => {
      setScheduledAt("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["patient", "appointments"] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const list = Array.isArray(data) ? data : data?.appointments || [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{isAr ? "المواعيد" : "Appointments"}</h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-bold">{isAr ? "طلب موعد جديد" : "Request Appointment"}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isAr ? "سبب الزيارة" : "Reason"}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="button"
            disabled={!scheduledAt || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {isAr ? "حجز موعد" : "Book"}
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState title={isAr ? "لا توجد مواعيد" : "No appointments"} />
      ) : (
        <div className="space-y-3">
          {list.map((a, idx) => (
            <div key={String(a.id || idx)} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="font-semibold">{String(a.reason || a.status || "Appointment")}</p>
              <p className="text-xs text-slate-500">{String(a.scheduledAt || "")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PatientNotificationsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["patient", "notifications"],
    queryFn: () => apiRequest<{ notifications?: Record<string, unknown>[] } | Record<string, unknown>[]>("/api/patient/notifications"),
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

export function PatientProfilePage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["patient", "profile"],
    queryFn: () => apiRequest<Record<string, unknown>>("/api/patient/profile"),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-xl font-bold">{isAr ? "الملف الشخصي للمريض" : "Patient Profile"}</h1>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-100 p-4 text-xs dark:bg-slate-800">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

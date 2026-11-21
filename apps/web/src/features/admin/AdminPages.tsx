import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/apiClient";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";

export function AdminDashboardPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: () => apiRequest<Record<string, unknown>>("/api/admin/dashboard-stats"),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{isAr ? "لوحة تحكم الإدارة" : "Admin Dashboard"}</h1>
      <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 text-xs dark:border-slate-800 dark:bg-slate-900">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function AdminListPage({
  title,
  queryKey,
  endpoint,
  extractKey,
}: {
  title: string;
  queryKey: string;
  endpoint: string;
  extractKey: string;
}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", queryKey],
    queryFn: () => apiRequest<Record<string, unknown> | Record<string, unknown>[]>(endpoint),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const list = Array.isArray(data)
    ? data
    : ((data?.[extractKey] as Record<string, unknown>[] | undefined) || []);

  if (list.length === 0) return <EmptyState title={title} />;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">{title}</h1>
      {list.map((item, idx) => (
        <div key={String(item.id || idx)} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
          {String(item.fullName || item.email || item.message || item.id)}
        </div>
      ))}
    </div>
  );
}

export const AdminUsersPage = () => (
  <AdminListPage title="Users" queryKey="users" endpoint="/api/admin/users" extractKey="users" />
);

export const AdminDoctorsPage = () => (
  <AdminListPage title="Doctors" queryKey="doctors" endpoint="/api/admin/doctors" extractKey="doctors" />
);

export const AdminPatientsPage = () => (
  <AdminListPage title="Patients" queryKey="patients" endpoint="/api/admin/patients" extractKey="patients" />
);

export const AdminChangeRequestsPage = () => (
  <AdminListPage
    title="Doctor Change Requests"
    queryKey="change-requests"
    endpoint="/api/admin/doctor-change-requests"
    extractKey="requests"
  />
);

export const AdminNotificationsPage = () => (
  <AdminListPage
    title="Admin Notifications"
    queryKey="notifications"
    endpoint="/api/admin/notifications"
    extractKey="notifications"
  />
);

export const AdminSettingsPage = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => apiRequest<Record<string, unknown>>("/api/admin/settings"),
  });
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-xl font-bold">System Settings</h1>
      <pre className="mt-4 overflow-x-auto text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

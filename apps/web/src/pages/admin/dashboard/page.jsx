"use client";

export const headers = () => {
  return [["Cache-Control", "no-store"]];
};

import { ArrowDownIcon, ArrowUpIcon, BriefcaseMedicalIcon, ChartLineIcon, CircleCheckIcon, ClockIcon, ScanLineIcon, UserRoundIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "@/lib/compat/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { ActivityList, Button, FeatureCard, MetricCard, PneumoCard, QuickActionCard } from "@/components/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import { formatActivityDescription } from "@/lib/activityFormat";
import { apiRequest } from "@/lib/apiClient";

export default function AdminDashboardPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("adminDashboard");
  const ui = useTranslations("ui");
  const basePrefix = `/${locale}`;
  const placeholder = ui("placeholder");

  const fetchActivitiesErrorMsg = t("errors.fetchActivities");
  const fetchPendingApprovalsErrorMsg = t("errors.fetchPendingApprovals");

  const { showSuccess, showError } = useToast();

  let formattedDate = new Date().toLocaleDateString(
    locale === "en" ? "en-US" : "ar-EG",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" },
  );

  // Ø¬Ù„Ø¨ Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ© Ù…Ù† API
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    doctors: 0,
    patients: 0,
    todayScans: 0,
    totalScans: 0,
  });

  if (locale === "ar") {
    formattedDate = formattedDate.replace(/[Ù -Ù©]/g, (d) =>
      String("Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©".indexOf(d)),
    );
  }

  useEffect(() => {
    apiRequest("/api/admin/dashboard-stats")
      .then((data) => {
        if (data) setStatsData(data);
      })
      .catch(() => {});
  }, []);

  const stats = [
    {
      title: t("stats.totalUsers"),
      value: statsData.totalUsers,
      change: "",
      changePercent: "",
      icon: UsersIcon,
      trend: "up",
    },
    {
      title: t("stats.doctors"),
      value: statsData.doctors,
      change: "",
      changePercent: "",
      icon: BriefcaseMedicalIcon,
      trend: "up",
    },
    {
      title: t("stats.patients"),
      value: statsData.patients,
      change: "",
      changePercent: "",
      icon: UserRoundIcon,
      trend: "up",
    },
    {
      title: t("stats.todayScans"),
      value: statsData.todayScans,
      change: "",
      changePercent: "",
      icon: ScanLineIcon,
      trend: "down",
    },
    {
      title: t("stats.totalScansAll"),
      value: statsData.totalScans,
      change: "",
      changePercent: "",
      icon: ScanLineIcon,
      trend: "up",
    },
  ];

  const quickActions = [
    {
      title: t("quickActions.users.title"),
      description: t("quickActions.users.desc"),
      Icon: UsersIcon,
      action: () => router.push(`${basePrefix}/admin/users`),
    },
    {
      title: t("quickActions.doctors.title"),
      description: t("quickActions.doctors.desc"),
      Icon: BriefcaseMedicalIcon,
      action: () => router.push(`${basePrefix}/admin/doctors`),
    },
    {
      title: t("quickActions.patients.title"),
      description: t("quickActions.patients.desc"),
      Icon: UserRoundIcon,
      action: () => router.push(`${basePrefix}/admin/patients`),
    },
  ];

  // Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù†Ø¸Ø§Ù… Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ©
  const [systemStatusData, setSystemStatusData] = useState({
    serverUptime: placeholder,
    responseTime: placeholder,
    memoryUsage: placeholder,
    dbSize: placeholder,
  });
  useEffect(() => {
    apiRequest("/api/admin/system-status")
      .then((data) => {
        if (data) setSystemStatusData(data);
      })
      .catch(() => {});
  }, []);
  const systemStatus = [
    {
      label: t("systemStatus.serverUptime"),
      value: systemStatusData.serverUptime,
      status: "success",
      icon: CircleCheckIcon,
    },
    {
      label: t("systemStatus.responseTime"),
      value: systemStatusData.responseTime,
      status: "success",
      icon: ClockIcon,
    },
    {
      label: t("systemStatus.memoryUsage"),
      value: systemStatusData.memoryUsage,
      status: "success",
      icon: CircleCheckIcon,
    },
    {
      label: t("systemStatus.dbSize"),
      value: systemStatusData.dbSize,
      status: "success",
      icon: CircleCheckIcon,
    },
  ];

  // Ø¬Ù„Ø¨ Ø§Ù„Ù†Ø´Ø§Ø·Ø§Øª Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ© Ù…Ù† API
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);

  useEffect(() => {
    setActivitiesLoading(true);
    apiRequest("/api/admin/recent-activities")
      .then((data) => {
        setRecentActivities(data?.activities || []);
        setActivitiesLoading(false);
      })
      .catch(() => {
        setActivitiesError(fetchActivitiesErrorMsg);
        setActivitiesLoading(false);
      });
  }, [fetchActivitiesErrorMsg]);

  // Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…Ø¹Ù„Ù‚Ø© Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ© (Ø§Ù„Ø£Ø·Ø¨Ø§Ø¡ ØºÙŠØ± Ø§Ù„Ù…ÙˆØ§ÙÙ‚ Ø¹Ù„ÙŠÙ‡Ù…)
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState(null);

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      setPendingLoading(true);
      try {
        const data = await apiRequest("/api/admin/doctors");
        if (data?.doctors) {
          // ØªØµÙÙŠØ© Ø§Ù„Ø£Ø·Ø¨Ø§Ø¡ Ø§Ù„Ù…Ø¹Ù„Ù‚ÙŠÙ† ÙÙ‚Ø·
          const pending = data.doctors
            .filter((doc) => doc.status === "pending")
            .map((doc) => ({
              id: doc.user?.id || doc.userId || doc.id,
              fullName: doc.user?.fullName || placeholder,
              email: doc.user?.email || placeholder,
              createdAt: doc.user?.createdAt || null,
              licenseNumber: doc.licenseNumber,
              phone: doc.phone,
            }));
          setPendingApprovals(pending);
        } else {
          setPendingApprovals([]);
        }
      } catch {
        setPendingError(fetchPendingApprovalsErrorMsg);
      } finally {
        setPendingLoading(false);
      }
    };
    fetchPendingApprovals();
  }, [fetchPendingApprovalsErrorMsg, placeholder]);

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-(--ui-success)";
      case "warning":
        return "text-(--ui-warning)";
      case "error":
        return "text-(--ui-danger)";
      default:
        return "text-(--ui-muted-2)";
    }
  };

  // Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ø£Ø¯Ù…Ù†
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    apiRequest("/api/admin/notifications-unread")
      .then((data) =>
        setUnreadCount((data && (data.badge ?? data.unread)) || 0),
      )
      .catch(() => setUnreadCount(0));
  }, []);

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <PageHeader title={t("title")} description={formattedDate} />

        {/* Top Asymmetric Bento: Pending Approvals Feature Spotlight + Metrics Grid */}
        <div className="pd-bento-grid mb-10">
          <div className="pd-span-4">
            <FeatureCard
              eyebrow={locale === "ar" ? "إدارة النظام" : "System Governance"}
              title={t("pendingApprovalsTitle")}
              description={`${pendingLoading ? t("pendingApprovals.loading") : pendingApprovals.length} — ${t("pendingApprovals.viewAll")}`}
              icon={BriefcaseMedicalIcon}
              tone="red"
              actionLabel={t("pendingApprovals.viewAll")}
              onAction={() => router.push(`${basePrefix}/admin/doctors?pending=1`)}
              className="h-full"
            />
          </div>

          <div className="pd-span-8">
            <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat, index) => {
                const tones = ["cream", "sage", "olive", "cream", "sage"];
                const layouts = ["editorial", "visual", "compact", "editorial", "compact"];
                return (
                  <MetricCard
                    key={index}
                    id={`admin-stat-${index}`}
                    label={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    tone={tones[index % tones.length]}
                    layout={layouts[index % layouts.length]}
                    trend={
                      stat.changePercent
                        ? {
                            label: stat.changePercent,
                            direction: stat.trend === "up" ? "up" : "down",
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions — 4-Tone Bento Row */}
        <div className="mb-10">
          <h2 className="mb-5 text-xl font-semibold text-[var(--pd-text-primary)]">
            {t("quickActionsTitle")}
          </h2>
          <div className="pd-bento-grid">
            {quickActions.map((action, index) => {
              const tones = ["cream", "red", "sage", "olive"];
              return (
                <div key={index} className="pd-span-3">
                  <QuickActionCard
                    title={action.title}
                    description={action.description}
                    icon={action.Icon}
                    tone={tones[index % tones.length]}
                    emphasis={index === 0 ? "primary" : "secondary"}
                    onClick={action.action}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="pd-bento-grid">
          {/* System Status */}
          <div className="pd-span-5">
            <PneumoCard tone="olive" hover={false}>
              <ActivityList
                title={t("systemStatusTitle")}
                headerAction={
                  <ChartLineIcon size={20} strokeWidth={1.7} aria-hidden="true" />
                }
                items={systemStatus.map((item, index) => ({
                  id: `sys-${index}`,
                  title: item.label,
                  timestamp: String(item.value ?? ""),
                  tone: item.status === "healthy" ? "sage" : "red",
                }))}
              />
            </PneumoCard>
          </div>

          {/* Pending Approvals */}
          <div className="pd-span-7">
            <PneumoCard tone="cream" hover={false}>
            <div className="mb-6 flex items-center justify-between border-b border-[var(--pd-border)] pb-4">
              <h2 className="text-lg font-semibold">
                {t("pendingApprovalsTitle")}
              </h2>
              <span className="rounded-full border border-current px-3 py-0.5 text-xs font-semibold">
                {pendingLoading
                  ? t("pendingApprovals.loading")
                  : pendingApprovals.length}
              </span>
            </div>
            {pendingError && (
              <div className="text-(--ui-danger) mb-4">{pendingError}</div>
            )}
            <div className="space-y-3">
              {pendingLoading ? (
                <div className="text-(--ui-muted-2)">
                  {t("pendingApprovals.loading")}
                </div>
              ) : pendingApprovals.length === 0 ? (
                <div className="text-(--ui-muted-2)">
                  {t("pendingApprovals.empty")}
                </div>
              ) : (
                <>
                  {pendingApprovals.map((approval, idx) => (
                    <div
                      key={approval.id || idx}
                      className="p-4 bg-(--ui-surface-2) rounded-lg border border-(--ui-border) hover:shadow-(--shadow-soft) transition-shadow mb-2"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-foreground">
                            {t("pendingApprovals.requestTitle")}
                          </h3>
                          <p className="text-sm text-(--ui-muted-2)">
                            <b>{t("pendingApprovals.fields.id")}</b>{" "}
                            {approval.id?.toString() || placeholder} <br />
                            <b>{t("pendingApprovals.fields.name")}</b>{" "}
                            {approval.fullName || placeholder} <br />
                            <b>{t("pendingApprovals.fields.email")}</b>{" "}
                            {approval.email || placeholder} <br />
                            <b>{t("pendingApprovals.fields.license")}</b>{" "}
                            {approval.licenseNumber || placeholder} <br />
                            <b>{t("pendingApprovals.fields.phone")}</b>{" "}
                            {approval.phone || placeholder} <br />
                            <b>{t("pendingApprovals.fields.created")}</b>{" "}
                            {approval.createdAt
                              ? new Date(approval.createdAt).toLocaleString(
                                  locale === "en" ? "en-US" : "ar-EG",
                                )
                              : placeholder}
                          </p>
                        </div>
                        <span className="text-xs text-(--ui-muted-2)">
                          {approval.createdAt
                            ? new Date(approval.createdAt).toLocaleDateString(
                                locale === "en" ? "en-US" : "ar-EG",
                              )
                            : placeholder}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          fullWidth
                          onClick={async () => {
                            try {
                              await apiRequest("/api/admin/doctors", {
                                method: "PATCH",
                                body: JSON.stringify({
                                  id: approval.id,
                                  status: "active",
                                }),
                              });
                              setPendingApprovals((prev) =>
                                prev.filter((d) => d.id !== approval.id),
                              );
                              showSuccess(t("toast.approved"));
                            } catch (err) {
                              showError(err?.message || "Failed to approve");
                            }
                          }}
                        >
                          {t("pendingApprovals.approve")}
                        </Button>
                        <button
                          onClick={async () => {
                            try {
                              await apiRequest("/api/admin/doctors", {
                                method: "PATCH",
                                body: JSON.stringify({
                                  id: approval.id,
                                  status: "banned",
                                }),
                              });
                              setPendingApprovals((prev) =>
                                prev.filter((d) => d.id !== approval.id),
                              );
                              showError(t("toast.rejected"));
                            } catch (err) {
                              showError(err?.message || "Failed to reject");
                            }
                          }}
                          className="flex-1 bg-(--ui-danger) hover:opacity-90 text-[var(--pd-on-accent)] px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          {t("pendingApprovals.reject")}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <button
              onClick={() =>
                router.push(`${basePrefix}/admin/doctors?pending=1`)
              }
              className="mt-4 w-full text-sm font-semibold underline underline-offset-4 opacity-85 hover:opacity-100"
            >
              {t("pendingApprovals.viewAll")}
            </button>
            </PneumoCard>
          </div>
        </div>

        {/* Recent Activities — Open Editorial List */}
        <div className="mt-10">
          {activitiesLoading ? (
            <div className="text-sm text-[var(--pd-text-muted)]">
              {t("recentActivity.loading")}
            </div>
          ) : activitiesError ? (
            <div className="text-sm text-[var(--pd-red)]">{activitiesError}</div>
          ) : (
            <ActivityList
              title={t("recentActivity.title")}
              emptyMessage={t("recentActivity.empty")}
              items={recentActivities.map((activity, idx) => ({
                id: String(activity.id || idx),
                title: formatActivityDescription(activity, locale),
                timestamp: new Date(activity.createdAt).toLocaleString(
                  locale === "en" ? "en-US" : "ar-EG",
                ),
                tone: ["red", "cream", "sage", "olive"][idx % 4],
              }))}
            />
          )}
        </div>
      </div>
    </>
  );
}

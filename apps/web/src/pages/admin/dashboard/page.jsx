"use client";

export const headers = () => {
  return [["Cache-Control", "no-store"]];
};

import { ArrowDownIcon, ArrowUpIcon, BriefcaseMedicalIcon, ChartLineIcon, CircleCheckIcon, ClockIcon, ScanLineIcon, UserRoundIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "@/lib/compat/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui";
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

        {/* Stats Row — equal 25/25/25/25 across Crimson, Parchment, Sage, Moss */}
        <div className="mb-10 grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {stats.map((stat, index) => {
            const shapes = ["pd-shape-asymmetric", "pd-shape-layered", "pd-shape-organic", "pd-shape-asymmetric", "pd-shape-layered"];
            const tones = ["pd-tone-crimson", "pd-tone-parchment", "pd-tone-sage", "pd-tone-moss"];
            return (
              <div
                key={index}
                className={`pd-panel pd-panel--interactive w-full p-5 ${shapes[index % shapes.length]} ${tones[index % tones.length]}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="pd-orb pd-shape-orbital border-[var(--pd-border-strong)] bg-black/15 text-[var(--pd-text-primary)]">
                    <stat.icon size={19} strokeWidth={1.7} />
                  </div>
                  {stat.changePercent ? (
                    <div
                      className={`pd-tabular flex items-center gap-1 text-xs font-medium ${stat.trend === "up" ? "text-[var(--pd-sage)]" : "text-[var(--pd-clay)]"}`}
                    >
                      {stat.trend === "up" ? <ArrowUpIcon size={13} /> : <ArrowDownIcon size={13} />}
                      <span>{stat.changePercent}</span>
                    </div>
                  ) : null}
                </div>
                <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[var(--pd-text-muted)]">
                  {stat.title}
                </h3>
                <p className="pd-metric-value">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions — Frameless Editorial */}
        <div className="mb-10">
          <h2 className="mb-5 text-xl font-semibold text-[var(--pd-text-primary)]">
            {t("quickActionsTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const ActionIcon = action.Icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="pd-shape-editorial group text-start transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="pd-orb pd-shape-orbital pd-orb--copper mb-3.5">
                    <ActionIcon size={18} strokeWidth={1.7} />
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold text-[var(--pd-text-primary)]">
                    {action.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--pd-text-muted)]">
                    {action.description}
                  </p>
                  <div className="mt-3.5 flex items-center gap-2 text-xs font-medium text-[var(--pd-copper)] transition-all group-hover:gap-3">
                    <span>{t("more")}</span>
                    <span>{locale === "en" ? "→" : "←"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* System Status */}
          <div className="pd-panel pd-shape-organic p-6">
            <div className="mb-5 flex items-center justify-between border-b border-[var(--pd-border)] pb-4">
              <h2 className="text-lg font-semibold text-[var(--pd-text-primary)]">
                {t("systemStatusTitle")}
              </h2>
              <ChartLineIcon size={20} strokeWidth={1.7} className="text-[var(--pd-copper)]" />
            </div>
            <div className="divide-y divide-[var(--pd-border)]">
              {systemStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3">
                    <item.icon className={getStatusColor(item.status)} />
                    <span className="text-sm font-medium text-[var(--pd-text-secondary)]">
                      {item.label}
                    </span>
                  </div>
                  <span className={`pd-tabular text-sm font-semibold ${getStatusColor(item.status)}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="pd-panel pd-shape-layered p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {t("pendingApprovalsTitle")}
              </h2>
              <span className="bg-(--ui-warning-bg) text-(--ui-warning) border border-(--ui-warning-border) px-3 py-1 rounded-full text-sm font-bold">
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
              className="w-full mt-4 text-(--ui-info) hover:underline text-sm font-medium"
            >
              {t("pendingApprovals.viewAll")}
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mt-8 card-glass rounded-xl shadow-(--shadow-soft) p-6 border border-(--ui-border)">
          <h2 className="text-xl font-bold text-foreground mb-6">
            {t("recentActivity.title")}
          </h2>
          <div className="space-y-4">
            {activitiesLoading ? (
              <div className="text-(--ui-muted-2)">
                {t("recentActivity.loading")}
              </div>
            ) : activitiesError ? (
              <div className="text-(--ui-danger)">{activitiesError}</div>
            ) : recentActivities.length === 0 ? (
              <div className="text-(--ui-muted-2)">
                {t("recentActivity.empty")}
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 bg-(--ui-surface-2) rounded-lg border border-(--ui-border) hover:bg-(--ui-surface) transition-colors"
                >
                  <div className="text-3xl">ðŸ“</div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {formatActivityDescription(activity, locale)}
                    </p>
                    <p className="text-sm text-(--ui-muted-2)">
                      {new Date(activity.createdAt).toLocaleString(
                        locale === "en" ? "en-US" : "ar-EG",
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
"use client";

export const headers = () => {
  return [["Cache-Control", "no-store"]];
};

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../components/ui/ToastProvider";
import {
  FaUsers,
  FaUserMd,
  FaUserInjured,
  FaXRay,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";
import NotificationBellButton from "../../../components/ui/NotificationBellButton";
import { useLocale, useTranslations } from "next-intl";
import { formatActivityDescription } from "../../../lib/activityFormat";

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

  // جلب الإحصائيات الحقيقية من API
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    doctors: 0,
    patients: 0,
    todayScans: 0,
    totalScans: 0,
  });

  if (locale === "ar") {
    formattedDate = formattedDate.replace(/[٠-٩]/g, (d) =>
      String("٠١٢٣٤٥٦٧٨٩".indexOf(d)),
    );
  }

  useEffect(() => {
    fetch("/api/admin/dashboard-stats")
      .then((res) => res.json())
      .then((data) => {
        setStatsData(data);
      })
      .catch(() => {});
  }, []);

  const stats = [
    {
      title: t("stats.totalUsers"),
      value: statsData.totalUsers,
      change: "",
      changePercent: "",
      icon: FaUsers,
      trend: "up",
    },
    {
      title: t("stats.doctors"),
      value: statsData.doctors,
      change: "",
      changePercent: "",
      icon: FaUserMd,
      trend: "up",
    },
    {
      title: t("stats.patients"),
      value: statsData.patients,
      change: "",
      changePercent: "",
      icon: FaUserInjured,
      trend: "up",
    },
    {
      title: t("stats.todayScans"),
      value: statsData.todayScans,
      change: "",
      changePercent: "",
      icon: FaXRay,
      trend: "down",
    },
    {
      title: t("stats.totalScansAll"),
      value: statsData.totalScans,
      change: "",
      changePercent: "",
      icon: FaXRay,
      trend: "up",
    },
  ];

  const quickActions = [
    {
      title: t("quickActions.users.title"),
      description: t("quickActions.users.desc"),
      icon: "👥",
      action: () => router.push(`${basePrefix}/admin/users`),
    },
    {
      title: t("quickActions.doctors.title"),
      description: t("quickActions.doctors.desc"),
      icon: "👨‍⚕️",
      action: () => router.push(`${basePrefix}/admin/doctors`),
    },
    {
      title: t("quickActions.patients.title"),
      description: t("quickActions.patients.desc"),
      icon: "🏥",
      action: () => router.push(`${basePrefix}/admin/patients`),
    },
  ];

  // معلومات النظام الحقيقية
  const [systemStatusData, setSystemStatusData] = useState({
    serverUptime: placeholder,
    responseTime: placeholder,
    memoryUsage: placeholder,
    dbSize: placeholder,
  });
  useEffect(() => {
    fetch("/api/admin/system-status")
      .then((res) => res.json())
      .then((data) => setSystemStatusData(data))
      .catch(() => {});
  }, []);
  const systemStatus = [
    {
      label: t("systemStatus.serverUptime"),
      value: systemStatusData.serverUptime,
      status: "success",
      icon: FaCheckCircle,
    },
    {
      label: t("systemStatus.responseTime"),
      value: systemStatusData.responseTime,
      status: "success",
      icon: FaClock,
    },
    {
      label: t("systemStatus.memoryUsage"),
      value: systemStatusData.memoryUsage,
      status: "success",
      icon: FaCheckCircle,
    },
    {
      label: t("systemStatus.dbSize"),
      value: systemStatusData.dbSize,
      status: "success",
      icon: FaCheckCircle,
    },
  ];

  // جلب النشاطات الحقيقية من API
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);

  useEffect(() => {
    setActivitiesLoading(true);
    fetch("/api/admin/recent-activities")
      .then((res) => res.json())
      .then((data) => {
        setRecentActivities(data.activities || []);
        setActivitiesLoading(false);
      })
      .catch(() => {
        setActivitiesError(fetchActivitiesErrorMsg);
        setActivitiesLoading(false);
      });
  }, [fetchActivitiesErrorMsg]);

  // الطلبات المعلقة الحقيقية (الأطباء غير الموافق عليهم)
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState(null);

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      setPendingLoading(true);
      try {
        const res = await fetch("/api/admin/doctors");
        const data = await res.json();
        if (data.doctors) {
          // تصفية الأطباء المعلقين فقط
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

  // إشعارات الأدمن
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    fetch("/api/admin/notifications-unread")
      .then((res) => res.json())
      .then((data) =>
        setUnreadCount((data && (data.badge ?? data.unread)) || 0),
      )
      .catch(() => setUnreadCount(0));
  }, []);

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("title")} 👨‍💼
            </h1>
            <p className="text-(--ui-muted-2) mt-2">{formattedDate}</p>
          </div>
          <NotificationBellButton
            count={unreadCount}
            onClick={() => router.push(`${basePrefix}/admin/notifications`)}
            title={t("notifications")}
            iconClassName="text-(--ui-muted-2)"
          />
        </div>

        {/* Stats Row - always in one line, scrollable on small screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8 w-full">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="card-glass rounded-xl shadow-(--shadow-soft) p-6 border border-(--ui-border) hover:shadow-(--shadow-lift) transition-shadow w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg brand-gradient shadow-(--shadow-soft)">
                  <stat.icon className="text-2xl text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-(--ui-success)" : "text-(--ui-danger)"}`}
                >
                  {stat.trend === "up" ? <FaArrowUp /> : <FaArrowDown />}
                  <span>{stat.changePercent}</span>
                </div>
              </div>
              <h3 className="text-(--ui-muted-2) text-sm font-medium mb-2">
                {stat.title}
              </h3>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t("quickActionsTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="card-glass text-foreground rounded-xl shadow-(--shadow-soft) p-6 border border-(--ui-border) hover:shadow-(--shadow-lift) transition-all hover:-translate-y-0.5 group text-left"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl brand-gradient text-white text-2xl shadow-(--shadow-soft) mb-3">
                  {action.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{action.title}</h3>
                <p className="text-sm text-(--ui-muted-2)">
                  {action.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-(--ui-muted-2) group-hover:gap-3 transition-all">
                  <span className="text-sm">{t("more")}</span>
                  <span className="group-hover:-translate-x-1 transition-transform">
                    {locale === "en" ? "→" : "←"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Status */}
          <div className="card-glass rounded-xl shadow-(--shadow-soft) p-6 border border-(--ui-border)">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {t("systemStatusTitle")}
              </h2>
              <FaChartLine className="text-2xl text-(--ui-info)" />
            </div>
            <div className="space-y-4">
              {systemStatus.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-(--ui-surface-2) rounded-lg border border-(--ui-border)"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={getStatusColor(item.status)} />
                    <span className="text-foreground font-medium">
                      {item.label}
                    </span>
                  </div>
                  <span className={`font-bold ${getStatusColor(item.status)}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="card-glass rounded-xl shadow-(--shadow-soft) p-6 border border-(--ui-border)">
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
                        <button
                          onClick={async () => {
                            await fetch("/api/admin/doctors", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                id: approval.id,
                                status: "active",
                              }),
                            });
                            setPendingApprovals((prev) =>
                              prev.filter((d) => d.id !== approval.id),
                            );
                            showSuccess(t("toast.approved"));
                          }}
                          className="flex-1 btn-gradient px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          {t("pendingApprovals.approve")}
                        </button>
                        <button
                          onClick={async () => {
                            await fetch("/api/admin/doctors", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                id: approval.id,
                                status: "banned",
                              }),
                            });
                            setPendingApprovals((prev) =>
                              prev.filter((d) => d.id !== approval.id),
                            );
                            showError(t("toast.rejected"));
                          }}
                          className="flex-1 bg-(--ui-danger) hover:opacity-90 text-white px-3 py-2 rounded-lg text-sm transition-colors"
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
                  <div className="text-3xl">📝</div>
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

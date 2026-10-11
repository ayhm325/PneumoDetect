"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../../components/ui/ToastProvider";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { formatTime } from "../../../lib/date";
import { formatActivityDescription } from "../../../lib/activityFormat";
import NotificationBellButton from "../../../components/ui/NotificationBellButton";
import useSocket from "../../../components/chat/useSocket.client";
import { Button, Card } from "../../../../src/components/ui";
import {
  FaUserMd,
  FaUsers,
  FaCalendarAlt,
  FaXRay,
  FaComments,
  FaCheckCircle,
  FaHourglassHalf,
  FaExclamationTriangle,
  FaArrowRight,
  FaClock,
  FaChartLine,
  FaClipboardList,
} from "react-icons/fa";

export default function DashboardHome({ serverData = {} }) {
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("doctorDashboard");
  const ui = useTranslations("ui");
  const patientT = useTranslations("patient");
  const basePrefix = locale === "en" ? "/en" : "/ar";
  const placeholder = ui("placeholder");

  const socket = useSocket();
  const [jwtToken, setJwtToken] = useState(null);
  // fetch JWT token so the dashboard can connect to socket.io for live counters
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/token", { credentials: "include" });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.token) setJwtToken(data.token);
        }
      } catch (e) {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    try {
      if (jwtToken) socket.connect({ token: jwtToken });
      else socket.connect();
    } catch (e) {
      try {
        socket.connect();
      } catch (e2) {}
    }
  }, [socket, jwtToken]);
  const seenMessageKeysRef = useRef(new Set());
  const [liveNewMessages, setLiveNewMessages] = useState(() => {
    const v = serverData?.counts?.newMessages;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  });

  // Live increment: receive messages via user room (no chat join needed).
  useEffect(() => {
    if (!socket || !socket.onMessage) return;
    const off = socket.onMessage((msg) => {
      try {
        if (!msg) return;
        // Doctor unread count = incoming from patient.
        if (msg.sender === "patient") {
          // Avoid double counting when the socket is joined to both `chat:<id>` and `user:<id>`.
          // We only count the user-scoped delivery for dashboard counters.
          if (msg.__scope && msg.__scope !== "user") return;
          const key = msg.id
            ? `id:${msg.id}`
            : msg.clientKey
              ? `ck:${msg.clientKey}`
              : null;
          if (key) {
            if (seenMessageKeysRef.current.has(key)) return;
            seenMessageKeysRef.current.add(key);
          }
          setLiveNewMessages((c) => Number(c || 0) + 1);
        }
      } catch (e) {}
    });
    return () => {
      try {
        off && off();
      } catch (e) {}
    };
  }, [socket]);

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/doctor/notifications", {
          method: "HEAD",
        });
        if (!mounted) return;
        if (res.ok) {
          const count = res.headers.get("X-Unread-Count");
          setUnreadNotificationsCount(Number(count) || 0);
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const safeRawObject = (key, fallback = {}) => {
    try {
      const val = t.raw(key);
      return val && typeof val === "object" && !Array.isArray(val)
        ? val
        : fallback;
    } catch {
      return fallback;
    }
  };

  const safeRawArray = (key, fallback = []) => {
    try {
      const val = t.raw(key);
      return Array.isArray(val) ? val : fallback;
    } catch {
      return fallback;
    }
  };

  const labels = {
    title: t("title"),
    welcome: t("welcome"),
    stats: {
      patients: t("stats.patients"),
      todayAppointments: t("stats.todayAppointments"),
      pendingScans: t("stats.pendingScans"),
      newMessages: t("stats.newMessages"),
    },
    quickActions: {
      viewPatients: t("quickActions.viewPatients"),
      viewPatientsDesc: t("quickActions.viewPatientsDesc"),
      medicalImages: t("quickActions.medicalImages"),
      medicalImagesDesc: t("quickActions.medicalImagesDesc"),
      appointments: t("quickActions.appointments"),
      appointmentsDesc: t("quickActions.appointmentsDesc"),
      chats: t("quickActions.chats"),
      chatsDesc: t("quickActions.chatsDesc"),
    },
    todayAppointments: {
      title: t("todayAppointments.title"),
      viewAll: t("todayAppointments.viewAll"),
      empty: t("todayAppointments.empty"),
      types: safeRawObject("todayAppointments.types", {}),
      status: safeRawObject("todayAppointments.status", {}),
    },
    pendingScans: {
      title: t("pendingScans.title"),
      viewAll: t("pendingScans.viewAll"),
      priority: safeRawObject("pendingScans.priority", {}),
    },
    recentActivityTitle: t("recentActivityTitle"),
    ui: {
      today: t("ui.today"),
      yesterday: t("ui.yesterday"),
      sampleDoctorName: t("ui.sampleDoctorName"),
    },
  };

  const formattedDateRaw = new Date().toLocaleDateString(
    locale === "en" ? "en-US" : "ar-EG-u-nu-latn",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" },
  );

  const normalizeArabicMonthNames = (value) => {
    if (!value || locale === "en") return value;
    const map = {
      يناير: "كانون الثاني",
      فبراير: "شباط",
      مارس: "آذار",
      أبريل: "نيسان",
      مايو: "أيار",
      يونيو: "حزيران",
      يوليو: "تموز",
      أغسطس: "آب",
      سبتمبر: "أيلول",
      أكتوبر: "تشرين الأول",
      نوفمبر: "تشرين الثاني",
      ديسمبر: "كانون الأول",
    };

    let out = value;
    for (const [from, to] of Object.entries(map)) {
      out = out.replaceAll(from, to);
    }
    return out;
  };

  const formattedDate = formattedDateRaw
    ? normalizeArabicMonthNames(formattedDateRaw.replace(/\u060C/g, "").trim())
    : formattedDateRaw;

  // Normalize date/time strings to avoid hydration mismatches between server and client
  const formatDateTime = (val) => {
    if (!val) return "";
    const raw =
      typeof val === "string"
        ? val
        : new Date(val).toLocaleString(
            locale === "en" ? "en-US" : "ar-EG-u-nu-latn",
          );
    // Remove Arabic comma (U+060C) and normalize whitespace so server and client match
    return normalizeArabicMonthNames(
      raw
        .replace(/\u060C/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    );
  };

  // Map DB appointment statuses to UI status keys we use for labels/colors
  const normalizeStatus = (s) => {
    if (!s) return "pending";
    if (s === "completed") return "confirmed";
    if (s === "scheduled") return "pending";
    if (s === "cancelled") return "cancelled";
    if (s === "no_show") return "no_show";
    return s;
  };

  const stats = [
    {
      title: labels.stats.patients,
      value: serverData.counts?.patients ?? "156",
      icon: FaUsers,
      color: "bg-(--ui-info)",
      bgLight: "bg-(--ui-info-bg)",
      textColor: "text-(--ui-info)",
    },
    {
      title: labels.stats.todayAppointments,
      value: serverData.counts?.todayAppointments ?? "12",
      icon: FaCalendarAlt,
      color: "bg-(--ui-success)",
      bgLight: "bg-(--ui-success-bg)",
      textColor: "text-(--ui-success)",
    },
    {
      title: labels.stats.pendingScans,
      value: serverData.counts?.pendingScans ?? "8",
      icon: FaXRay,
      color: "bg-(--ui-warning)",
      bgLight: "bg-(--ui-warning-bg)",
      textColor: "text-(--ui-warning)",
    },
    {
      title: labels.stats.newMessages,
      value: liveNewMessages,
      icon: FaComments,
      color: "bg-(--ui-info)",
      bgLight: "bg-(--ui-info-bg)",
      textColor: "text-(--ui-info)",
    },
  ];

  // Use appointments provided by the server. If none, show an empty array so UI can display a no-data message.
  const todayAppointments =
    serverData.todayAppointments && serverData.todayAppointments.length
      ? serverData.todayAppointments.map((a, i) => ({
          id: a.id || i,
          time: formatTime(
            a.time,
            locale === "en" ? "en-US" : "ar-EG-u-nu-latn",
            placeholder,
          ),
          patient: a.patient,
          type: a.type || "consult",
          status: a.status,
        }))
      : [];

  const defaultRecentActivity = useMemo(
    () => [
      {
        id: 1,
        action: t("recentActivity.defaults.reviewXray"),
        time: t("recentActivity.times.min10"),
        icon: FaCheckCircle,
        color: "text-(--ui-success)",
      },
      {
        id: 2,
        action: t("recentActivity.defaults.newAppointment"),
        time: t("recentActivity.times.min25"),
        icon: FaCalendarAlt,
        color: "text-(--ui-info)",
      },
      {
        id: 3,
        action: t("recentActivity.defaults.newMessage"),
        time: t("recentActivity.times.min45"),
        icon: FaComments,
        color: "text-(--ui-info)",
      },
      {
        id: 4,
        action: t("recentActivity.defaults.reportReady"),
        time: t("recentActivity.times.hour1"),
        icon: FaClipboardList,
        color: "text-(--ui-warning)",
      },
    ],
    [t],
  );

  const recentActivity =
    serverData.recentActivity && serverData.recentActivity.length
      ? serverData.recentActivity.map((r, i) => ({
          id: r.id || i,
          action: formatActivityDescription(
            { type: r.type, description: r.description, meta: r.meta },
            locale,
          ),
          time: formatDateTime(r.time),
          icon: FaClipboardList,
          color: "text-(--ui-warning)",
        }))
      : defaultRecentActivity;

  const pendingScans =
    serverData.pendingScansList && serverData.pendingScansList.length
      ? serverData.pendingScansList.map((s, i) => {
          const createdAt = s.createdAt ? new Date(s.createdAt) : null;
          const now = new Date();
          const isSameDay = (a, b) =>
            a && b && a.toDateString() === b.toDateString();
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);

          const dateLabel = isSameDay(createdAt, now)
            ? labels.ui.today
            : isSameDay(createdAt, yesterday)
              ? labels.ui.yesterday
              : createdAt
                ? formatDateTime(createdAt)
                : "";

          const score =
            typeof s.confidenceScore === "number" ? s.confidenceScore : null;
          const priority =
            score == null
              ? "low"
              : score >= 0.85
                ? "high"
                : score >= 0.65
                  ? "medium"
                  : "low";

          const typeLabel = s.type
            ? (labels.todayAppointments.types?.[s.type] ?? s.type)
            : "";

          return {
            id: s.id ?? i + 1,
            patient: s.patient ?? placeholder,
            type: typeLabel,
            date: dateLabel,
            priority,
            clinicalStatus:
              s.patientClinicalStatus ||
              s.patient?.clinicalStatus ||
              s.clinicalStatus ||
              "",
          };
        })
      : [];

  const quickActions = [
    {
      title: labels.quickActions.viewPatients,
      description: labels.quickActions.viewPatientsDesc,
      icon: FaUsers,
      link: `${basePrefix}/doctor/patients`,
    },
    {
      title: labels.quickActions.medicalImages,
      description: labels.quickActions.medicalImagesDesc,
      icon: FaXRay,
      link: `${basePrefix}/doctor/results`,
    },
    {
      title: labels.quickActions.appointments,
      description: labels.quickActions.appointmentsDesc,
      icon: FaCalendarAlt,
      link: `${basePrefix}/doctor/appointments`,
    },
    {
      title: labels.quickActions.chats,
      description: labels.quickActions.chatsDesc,
      icon: FaComments,
      link: `${basePrefix}/doctor/chat`,
    },
  ];

  const handleQuickAction = (link) => {
    router.push(link);
  };

  return (
    <>

      <div className="min-h-screen bg-(--ui-surface-2) font-bold text-(--ui-foreground) p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-(--ui-foreground) flex items-center gap-3">
                <FaUserMd className="text-(--ui-info)" />
                {labels.title}
              </h1>
              <p className="mt-2 text-(--ui-muted-foreground)">
                {labels.welcome}{" "}
                {serverData.doctor?.user?.fullName ||
                  labels.ui.sampleDoctorName}{" "}
                - {formattedDate}
              </p>
            </div>
            <NotificationBellButton
              count={unreadNotificationsCount}
              onClick={() => router.push(`${basePrefix}/doctor/notifications`)}
              title={ui("topbar.notifications")}
            />
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  variant="interactive"
                  className="group relative overflow-hidden"
                >
                  <div
                    className={`absolute top-0 right-0 h-20 w-20 translate-x-8 -translate-y-8 transform rounded-full ${stat.bgLight} opacity-50 transition-transform group-hover:scale-150`}
                  ></div>
                  <div className="relative">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="flex items-center gap-3 justify-center">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}
                        >
                          <Icon className="text-2xl text-white" />
                        </div>
                        <p className="text-lg font-semibold text-(--ui-muted-foreground) text-center">
                          {stat.title}
                        </p>
                      </div>
                      <p className="mt-3 text-3xl font-semibold text-(--ui-foreground) text-center">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  onClick={() => handleQuickAction(action.link)}
                  fullWidth
                  size="lg"
                  className="group !h-auto min-h-[132px] !items-start !justify-start gap-2 rounded-xl p-5 text-start"
                >
                  <div className="mb-3 flex w-full items-center justify-between">
                    <Icon className="text-3xl" />
                    <FaArrowRight className="transition-transform group-hover:-translate-x-1" />
                  </div>
                  <h3 className="text-lg font-bold">{action.title}</h3>
                  <p className="mt-1 text-sm opacity-90">
                    {action.description}
                  </p>
                </Button>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Today's Appointments */}
            <Card className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-(--ui-foreground) flex items-center gap-2">
                  <FaCalendarAlt className="text-(--ui-info)" />
                  {labels.todayAppointments.title}
                </h2>
                <Link
                  href={`${basePrefix}/doctor/appointments`}
                  className="text-sm text-(--ui-info) hover:opacity-90 font-medium"
                >
                  {labels.todayAppointments.viewAll}
                </Link>
              </div>
              <div className="space-y-3">
                {todayAppointments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-(--ui-border) p-6 text-center text-(--ui-muted-foreground)">
                    {labels.todayAppointments.empty}
                  </div>
                ) : (
                  todayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between rounded-lg border border-(--ui-border) p-4 transition-all hover:bg-(--ui-surface-2)"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-(--ui-info-bg)">
                          <FaClock className="text-(--ui-info)" />
                        </div>
                        <div>
                          <p className="font-bold text-(--ui-foreground)">
                            {apt.patient}
                          </p>
                          <p className="text-sm text-(--ui-muted-foreground)">
                            {apt.place ||
                              apt.location ||
                              labels.todayAppointments.types[apt.type] ||
                              apt.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-(--ui-foreground)">
                          {apt.time}
                        </p>
                        {(() => {
                          const displayStatus = normalizeStatus(apt.status);
                          const badgeClass =
                            displayStatus === "confirmed"
                              ? "bg-(--ui-success-bg) text-(--ui-success)"
                              : displayStatus === "pending"
                                ? "bg-(--ui-warning-bg) text-(--ui-warning)"
                                : displayStatus === "cancelled"
                                  ? "bg-(--ui-danger-bg) text-(--ui-danger)"
                                  : "bg-(--ui-surface-2) text-(--ui-foreground)";
                          return (
                            <span
                              className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${badgeClass}`}
                            >
                              {labels.todayAppointments.status[displayStatus] ||
                                displayStatus}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Pending Scans */}
            <Card>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-(--ui-foreground) flex items-center gap-2">
                  <FaXRay className="text-(--ui-warning)" />
                  {labels.pendingScans.title}
                </h2>
              </div>
              <div className="space-y-3">
                {pendingScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="rounded-lg border border-(--ui-border) p-4 transition-all hover:bg-(--ui-surface-2)"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-(--ui-foreground)">
                        {scan.patient}
                      </p>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          scan.clinicalStatus === "critical"
                            ? "bg-(--ui-danger-bg) text-(--ui-danger)"
                            : scan.clinicalStatus === "recovering"
                              ? "bg-(--ui-info-bg) text-(--ui-info) font-semibold text-sm px-3 py-1"
                              : scan.clinicalStatus === "stable"
                                ? "bg-(--ui-success-bg) text-(--ui-success)"
                                : scan.priority === "high"
                                  ? "bg-(--ui-danger-bg) text-(--ui-danger)"
                                  : scan.priority === "medium"
                                    ? "bg-(--ui-warning-bg) text-(--ui-warning)"
                                    : "bg-(--ui-info-bg) text-(--ui-info)"
                        }`}
                      >
                        {scan.clinicalStatus
                          ? patientT(
                              `clinicalStatuses.${scan.clinicalStatus}`,
                            ) || scan.clinicalStatus
                          : labels.pendingScans.priority[scan.priority] ||
                            scan.priority}
                      </span>
                    </div>
                    {scan.type ? (
                      <p className="text-sm text-(--ui-muted-foreground)">
                        {scan.type}
                      </p>
                    ) : null}
                    <p className="text-xs text-(--ui-muted-foreground) mt-1">
                      {scan.date}
                    </p>
                  </div>
                ))}
                <Button
                  onClick={() => router.push(`${basePrefix}/doctor/results`)}
                  size="sm"
                >
                  {labels.pendingScans.viewAll}
                </Button>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-(--ui-foreground) flex items-center gap-2">
                <FaChartLine className="text-(--ui-info)" />
                {labels.recentActivityTitle}
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="rounded-lg border border-(--ui-border) p-4 transition-all hover:bg-(--ui-surface-2)"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${activity.color}`}>
                        <Icon className="text-xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-(--ui-foreground) truncate">
                          {activity.action}
                        </p>
                        <p className="text-xs text-(--ui-muted-foreground) mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

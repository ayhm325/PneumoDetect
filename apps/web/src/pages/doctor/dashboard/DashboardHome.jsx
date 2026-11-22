"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { useRouter } from "@/lib/compat/navigation";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import Link from "@/lib/compat/Link";
import { formatTime } from "@/lib/date";
import { formatActivityDescription } from "@/lib/activityFormat";
import useSocket from "@/components/chat/useSocket.client";
import { apiFetch, apiRequest } from "@/lib/apiClient";
import { Button, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/ui/PageHeader";
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
        const data = await apiRequest("/api/auth/token");
        if (!mounted) return;
        if (data?.token) setJwtToken(data.token);
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
        const res = await apiFetch("/api/doctor/notifications", {
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
      "يناير": "كانون الثاني",
      "فبراير": "شباط",
      "مارس": "آذار",
      "أبريل": "نيسان",
      "مايو": "أيار",
      "يونيو": "حزيران",
      "يوليو": "تموز",
      "أغسطس": "آب",
      "سبتمبر": "أيلول",
      "أكتوبر": "تشرين الأول",
      "نوفمبر": "تشرين الثاني",
      "ديسمبر": "كانون الأول",
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

  const [liveData, setLiveData] = useState({
    counts: { patients: 0, todayAppointments: 0, pendingScans: 0, newMessages: 0 },
    todayAppointments: [],
    pendingScansList: [],
    recentActivity: [],
    doctorName: "",
  });

  const hasServerData = Boolean(serverData && Object.keys(serverData).length > 0);

  useEffect(() => {
    if (hasServerData) return;
    let mounted = true;
    (async () => {
      try {
        const [meJson, pJson, aJson, rJson, cJson] = await Promise.all([
          apiRequest("/api/doctor/me").catch(() => ({})),
          apiRequest("/api/doctor/patients").catch(() => ({})),
          apiRequest("/api/doctor/appointments").catch(() => ({})),
          apiRequest("/api/doctor/results").catch(() => ({})),
          apiRequest("/api/chat/doctor").catch(() => ({})),
        ]);
        if (!mounted) return;

        const patients = Array.isArray(pJson) ? pJson : Array.isArray(pJson?.patients) ? pJson.patients : [];
        const appointments = Array.isArray(aJson?.appointments) ? aJson.appointments : Array.isArray(aJson) ? aJson : [];
        const results = Array.isArray(rJson?.records) ? rJson.records : Array.isArray(rJson?.results) ? rJson.results : Array.isArray(rJson?.data) ? rJson.data : [];
        const chats = Array.isArray(cJson?.chats) ? cJson.chats : Array.isArray(cJson) ? cJson : [];

        const todayStr = new Date().toDateString();
        const todayAppts = appointments.filter((a) => a.scheduledAt && new Date(a.scheduledAt).toDateString() === todayStr);
        const pendingResults = results.filter((r) => !r.reviewedByDoctor && r.status !== "reviewed" && r.status !== "completed");
        const unreadMsgs = chats.reduce((acc, ch) => acc + Number(ch.unreadCount || 0), 0);

        setLiveData({
          doctorName: meJson?.profile?.name || meJson?.user?.fullName || meJson?.fullName || "",
          counts: {
            patients: patients.length,
            todayAppointments: todayAppts.length,
            pendingScans: pendingResults.length,
            newMessages: unreadMsgs,
          },
          todayAppointments: todayAppts.map((a) => ({
            id: a.id,
            time: a.scheduledAt,
            patient: a.patientName || a.patient?.fullName || placeholder,
            type: a.type || "consult",
            status: a.status,
          })),
          pendingScansList: pendingResults.slice(0, 5),
          recentActivity: [],
        });
        setLiveNewMessages(unreadMsgs);
      } catch {
        // Keep zero defaults on fetch error
      }
    })();
    return () => {
      mounted = false;
    };
  }, [hasServerData, placeholder]);

  const effectiveData =
    serverData && Object.keys(serverData).length > 0 ? serverData : liveData;

  const stats = [
    {
      title: labels.stats.patients,
      value: effectiveData.counts?.patients ?? 0,
      icon: FaUsers,
      color: "bg-(--ui-info)",
      bgLight: "bg-(--ui-info-bg)",
      textColor: "text-(--ui-info)",
    },
    {
      title: labels.stats.todayAppointments,
      value: effectiveData.counts?.todayAppointments ?? 0,
      icon: FaCalendarAlt,
      color: "bg-(--ui-success)",
      bgLight: "bg-(--ui-success-bg)",
      textColor: "text-(--ui-success)",
    },
    {
      title: labels.stats.pendingScans,
      value: effectiveData.counts?.pendingScans ?? 0,
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
    effectiveData.todayAppointments && effectiveData.todayAppointments.length
      ? effectiveData.todayAppointments.map((a, i) => ({
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

  const recentActivity =
    effectiveData.recentActivity && effectiveData.recentActivity.length
      ? effectiveData.recentActivity.map((r, i) => ({
          id: r.id || i,
          action: formatActivityDescription(
            { type: r.type, description: r.description, meta: r.meta },
            locale,
          ),
          time: formatDateTime(r.time),
          icon: FaClipboardList,
          color: "text-(--ui-warning)",
        }))
      : [];

  const pendingScans =
    effectiveData.pendingScansList && effectiveData.pendingScansList.length
      ? effectiveData.pendingScansList.map((s, i) => {
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

      <div className="space-y-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <PageHeader
            title={labels.title}
            description={`${labels.welcome}${effectiveData.doctorName || effectiveData.doctor?.user?.fullName ? ` ${effectiveData.doctorName || effectiveData.doctor?.user?.fullName}` : ""} · ${formattedDate}`}
          />

          {/* Stats Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const tone =
                index === 1
                  ? "success"
                  : index === 2
                    ? "warning"
                    : "info";
              return (
                <StatCard
                  key={index}
                  label={stat.title}
                  value={stat.value}
                  icon={<Icon />}
                  tone={tone}
                />
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card
                  key={index}
                  variant="interactive"
                  size="sm"
                  onClick={() => handleQuickAction(action.link)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleQuickAction(action.link);
                    }
                  }}
                  className="group cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-(--ui-info-border) bg-(--ui-info-bg) text-(--color-primary) text-xl">
                      <Icon />
                    </div>
                    <FaArrowRight className="text-sm text-(--ui-muted-foreground) transition-transform group-hover:-translate-x-1 group-hover:text-(--color-primary)" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-(--ui-foreground)">
                      {action.title}
                    </h3>
                    <p className="mt-1 text-xs text-(--ui-muted-foreground) leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </Card>
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
            {recentActivity.length === 0 ? (
              <div className="rounded-xl border border-dashed border-(--ui-border) bg-(--ui-surface-2)/40 px-4 py-8 text-center text-sm text-(--ui-muted-foreground)">
                {locale === "ar"
                  ? "لا يوجد نشاط سريري مسجل حتى الآن."
                  : "No clinical activity recorded yet."}
              </div>
            ) : (
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
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

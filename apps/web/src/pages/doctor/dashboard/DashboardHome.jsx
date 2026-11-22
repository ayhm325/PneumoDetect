"use client";
import { ArrowRightIcon, BriefcaseMedicalIcon, CalendarDaysIcon, ChartLineIcon, CircleCheckIcon, ClipboardListIcon, ClockIcon, HourglassIcon, MessagesSquareIcon, ScanLineIcon, TriangleAlertIcon, UsersIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { useRouter } from "@/lib/compat/navigation";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import Link from "@/lib/compat/Link";
import { formatTime } from "@/lib/date";
import { formatActivityDescription } from "@/lib/activityFormat";
import useSocket from "@/components/chat/useSocket.client";
import { apiFetch, apiRequest } from "@/lib/apiClient";
import { Button, StatCard, Surface } from "@/components/ui";
import { PageHeader } from "@/components/ui/PageHeader";

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
      icon: UsersIcon,
      color: "bg-(--ui-info)",
      bgLight: "bg-(--ui-info-bg)",
      textColor: "text-(--ui-info)",
    },
    {
      title: labels.stats.todayAppointments,
      value: effectiveData.counts?.todayAppointments ?? 0,
      icon: CalendarDaysIcon,
      color: "bg-(--ui-success)",
      bgLight: "bg-(--ui-success-bg)",
      textColor: "text-(--ui-success)",
    },
    {
      title: labels.stats.pendingScans,
      value: effectiveData.counts?.pendingScans ?? 0,
      icon: ScanLineIcon,
      color: "bg-(--ui-warning)",
      bgLight: "bg-(--ui-warning-bg)",
      textColor: "text-(--ui-warning)",
    },
    {
      title: labels.stats.newMessages,
      value: liveNewMessages,
      icon: MessagesSquareIcon,
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
          patient:
            typeof a.patient === "string"
              ? a.patient
              : a.patient?.fullName || a.patient?.name || a.patient?.email || placeholder,
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
          icon: ClipboardListIcon,
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
            patient:
              typeof s.patient === "string"
                ? s.patient
                : s.patient?.fullName || s.patient?.name || s.patient?.email || placeholder,
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
      icon: UsersIcon,
      link: `${basePrefix}/doctor/patients`,
    },
    {
      title: labels.quickActions.medicalImages,
      description: labels.quickActions.medicalImagesDesc,
      icon: ScanLineIcon,
      link: `${basePrefix}/doctor/results`,
    },
    {
      title: labels.quickActions.appointments,
      description: labels.quickActions.appointmentsDesc,
      icon: CalendarDaysIcon,
      link: `${basePrefix}/doctor/appointments`,
    },
    {
      title: labels.quickActions.chats,
      description: labels.quickActions.chatsDesc,
      icon: MessagesSquareIcon,
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

          {/* Stats — equal 25/25/25/25 across Crimson, Parchment, Sage, Moss */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const tones = ["crimson", "parchment", "sage", "moss"];
              const shapes = ["orbital", "editorial", "layered", "slanted"];
              return (
                <StatCard
                  key={index}
                  label={stat.title}
                  value={stat.value}
                  icon={<Icon size={18} strokeWidth={1.7} />}
                  tone={tones[index % tones.length]}
                  shape={shapes[index % shapes.length]}
                />
              );
            })}
          </div>

          {/* Quick Actions — Frameless Editorial Strip */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Surface
                  key={index}
                  shape="editorial"
                  interactive
                  onClick={() => handleQuickAction(action.link)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleQuickAction(action.link);
                    }
                  }}
                  className="group flex cursor-pointer flex-col justify-between gap-3 pt-5"
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="pd-orb pd-shape-orbital pd-orb--copper">
                      <Icon size={18} strokeWidth={1.7} />
                    </div>
                    <ArrowRightIcon
                      size={16}
                      strokeWidth={1.7}
                      className="text-[var(--pd-text-muted)] transition-transform group-hover:-translate-x-1 group-hover:text-[var(--pd-copper)]"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--pd-text-primary)]">
                      {action.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--pd-text-muted)]">
                      {action.description}
                    </p>
                  </div>
                </Surface>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Today's Appointments — Asymmetric Panel + Clinical Timeline */}
            <Surface shape="asymmetric" className="p-6 lg:col-span-2">
              <div className="mb-6 flex items-center justify-between border-b border-[var(--pd-border)] pb-4">
                <h2 className="flex items-center gap-2.5 text-lg font-semibold text-[var(--pd-text-primary)]">
                  <CalendarDaysIcon size={18} strokeWidth={1.7} className="text-[var(--pd-copper)]" />
                  {labels.todayAppointments.title}
                </h2>
                <Link
                  href={`${basePrefix}/doctor/appointments`}
                  className="pd-btn pd-btn--link text-xs"
                >
                  {labels.todayAppointments.viewAll}
                </Link>
              </div>
              {todayAppointments.length === 0 ? (
                <div className="py-8 text-center text-sm text-[var(--pd-text-muted)]">
                  {labels.todayAppointments.empty}
                </div>
              ) : (
                <ol className="relative space-y-5 border-s border-[var(--pd-border-strong)] ps-5">
                  {todayAppointments.map((apt) => {
                    const displayStatus = normalizeStatus(apt.status);
                    const badgeClass =
                      displayStatus === "confirmed"
                        ? "bg-[var(--pd-sage-soft)] text-[var(--pd-sage)]"
                        : displayStatus === "pending"
                          ? "bg-[var(--pd-ochre-soft)] text-[var(--pd-ochre)]"
                          : displayStatus === "cancelled"
                            ? "bg-[var(--pd-clay-soft)] text-[var(--pd-clay)]"
                            : "bg-[var(--pd-surface-2)] text-[var(--pd-text-secondary)]";
                    return (
                      <li key={apt.id} className="relative flex items-center justify-between gap-4">
                        <span
                          aria-hidden="true"
                          className="absolute -start-[25px] top-2 h-2.5 w-2.5 rounded-full bg-[var(--pd-copper)] ring-4 ring-[var(--pd-surface)]"
                        />
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div className="pd-orb pd-orb--sm pd-shape-orbital pd-orb--copper">
                            <ClockIcon size={14} strokeWidth={1.7} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[var(--pd-text-primary)]">
                              {apt.patient}
                            </p>
                            <p className="truncate text-xs text-[var(--pd-text-muted)]">
                              {apt.place ||
                                apt.location ||
                                labels.todayAppointments.types[apt.type] ||
                                apt.type}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-end">
                          <p className="pd-tabular text-sm font-medium text-[var(--pd-text-primary)]">
                            {apt.time}
                          </p>
                          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
                            {labels.todayAppointments.status[displayStatus] || displayStatus}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Surface>

            {/* Pending Scans — Architectural Arch + Open Divide List */}
            <Surface shape="arch" tone="inset" className="p-6 pt-8">
              <div className="mb-5 flex items-center justify-between border-b border-[var(--pd-border)] pb-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--pd-text-primary)]">
                  <ScanLineIcon size={18} strokeWidth={1.7} className="text-[var(--pd-ochre)]" />
                  {labels.pendingScans.title}
                </h2>
              </div>
              <div className="divide-y divide-[var(--pd-border)]">
                {pendingScans.map((scan) => (
                  <div key={scan.id} className="py-3.5 first:pt-1">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-[var(--pd-text-primary)]">
                        {scan.patient}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          scan.clinicalStatus === "critical" || scan.priority === "high"
                            ? "bg-[var(--pd-clay-soft)] text-[var(--pd-clay)]"
                            : scan.clinicalStatus === "stable"
                              ? "bg-[var(--pd-sage-soft)] text-[var(--pd-sage)]"
                              : scan.priority === "medium"
                                ? "bg-[var(--pd-ochre-soft)] text-[var(--pd-ochre)]"
                                : "bg-[var(--pd-copper-soft)] text-[var(--pd-copper)]"
                        }`}
                      >
                        {scan.clinicalStatus
                          ? patientT(`clinicalStatuses.${scan.clinicalStatus}`) || scan.clinicalStatus
                          : labels.pendingScans.priority[scan.priority] || scan.priority}
                      </span>
                    </div>
                    {scan.type ? (
                      <p className="text-xs text-[var(--pd-text-secondary)]">{scan.type}</p>
                    ) : null}
                    <p className="pd-tabular mt-1 text-xs text-[var(--pd-text-muted)]">{scan.date}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button onClick={() => router.push(`${basePrefix}/doctor/results`)} size="sm" variant="outline">
                  {labels.pendingScans.viewAll}
                </Button>
              </div>
            </Surface>
          </div>

          {/* Recent Activity — Frameless Editorial */}
          <Surface shape="editorial" className="pt-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--pd-text-primary)]">
                <ChartLineIcon size={18} strokeWidth={1.7} className="text-[var(--pd-copper)]" />
                {labels.recentActivityTitle}
              </h2>
            </div>
            {recentActivity.length === 0 ? (
              <div className="py-6 text-sm text-[var(--pd-text-muted)]">
                {locale === "ar"
                  ? "لا يوجد نشاط سريري مسجل حتى الآن."
                  : "No clinical activity recorded yet."}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {recentActivity.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 border-s border-[var(--pd-border-strong)] ps-3.5"
                    >
                      <div className={`mt-0.5 ${activity.color}`}>
                        <Icon size={16} strokeWidth={1.7} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--pd-text-primary)]">
                          {activity.action}
                        </p>
                        <p className="pd-tabular mt-1 text-xs text-[var(--pd-text-muted)]">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Surface>
        </div>
      </div>
    </>
  );
}

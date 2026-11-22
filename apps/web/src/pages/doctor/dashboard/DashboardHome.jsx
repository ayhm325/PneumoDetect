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
import { ActivityList, Button, FeatureCard, MetricCard, PneumoCard, QuickActionCard } from "@/components/ui";
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

          {/* Top Asymmetric Bento: Primary Screening Feature + 2x2 Metric Cluster */}
          <div className="pd-bento-grid">
            <div className="pd-span-5">
              <FeatureCard
                eyebrow={locale === "ar" ? "سير العمل السريري" : "Clinical Workflow"}
                title={quickActions[1]?.title || labels.pendingScans.title}
                description={quickActions[1]?.description || ""}
                icon={quickActions[1]?.icon}
                tone="olive"
                actionLabel={quickActions[1]?.title}
                onAction={() => handleQuickAction(quickActions[1]?.link)}
                className="h-full"
              />
            </div>

            <div className="pd-span-7">
              <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2">
                {stats.map((stat, index) => {
                  const tones = ["red", "cream", "sage", "cream"];
                  const layouts = ["editorial", "visual", "compact", "editorial"];
                  return (
                    <MetricCard
                      key={index}
                      id={`doctor-stat-${index}`}
                      label={stat.title}
                      value={stat.value}
                      icon={stat.icon}
                      tone={tones[index % tones.length]}
                      layout={layouts[index % layouts.length]}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Secondary Quick Actions — 3-column Bento Strip */}
          <div className="pd-bento-grid">
            {quickActions
              .filter((_, idx) => idx !== 1)
              .map((action, index) => {
                const tones = ["cream", "red", "sage"];
                return (
                  <div key={action.link} className="pd-span-4">
                    <QuickActionCard
                      title={action.title}
                      description={action.description}
                      icon={action.icon}
                      tone={tones[index % tones.length]}
                      onClick={() => handleQuickAction(action.link)}
                    />
                  </div>
                );
              })}
          </div>

          {/* Main Content Bento Grid */}
          <div className="pd-bento-grid">
            <div className="pd-span-7">
              <PneumoCard tone="cream" hover={false}>
                <ActivityList
                  title={labels.todayAppointments.title}
                  emptyMessage={labels.todayAppointments.empty}
                  headerAction={
                    <Link
                      href={`${basePrefix}/doctor/appointments`}
                      className="text-xs font-semibold underline underline-offset-4 opacity-85 hover:opacity-100"
                    >
                      {labels.todayAppointments.viewAll}
                    </Link>
                  }
                  items={todayAppointments.map((apt) => {
                    const displayStatus = normalizeStatus(apt.status);
                    const statusLabel = labels.todayAppointments.status[displayStatus] || displayStatus;
                    const placeOrType =
                      apt.place ||
                      apt.location ||
                      labels.todayAppointments.types[apt.type] ||
                      apt.type;
                    return {
                      id: String(apt.id),
                      title: apt.patient,
                      description: `${placeOrType} · ${statusLabel}`,
                      timestamp: apt.time,
                      tone:
                        displayStatus === "confirmed"
                          ? "sage"
                          : displayStatus === "cancelled"
                            ? "red"
                            : "olive",
                    };
                  })}
                />
              </PneumoCard>
            </div>

            <div className="pd-span-5">
              <PneumoCard tone="olive" hover={false}>
                <ActivityList
                  title={labels.pendingScans.title}
                  emptyMessage={
                    locale === "ar"
                      ? "لا توجد فحوصات معلقة حالياً."
                      : "No pending scans right now."
                  }
                  headerAction={
                    <button
                      type="button"
                      onClick={() => router.push(`${basePrefix}/doctor/results`)}
                      className="text-xs font-semibold underline underline-offset-4 opacity-90 hover:opacity-100"
                    >
                      {labels.pendingScans.viewAll}
                    </button>
                  }
                  items={pendingScans.map((scan) => {
                    const statusText = scan.clinicalStatus
                      ? patientT(`clinicalStatuses.${scan.clinicalStatus}`) || scan.clinicalStatus
                      : labels.pendingScans.priority[scan.priority] || scan.priority;
                    return {
                      id: String(scan.id),
                      title: scan.patient,
                      description: scan.type ? `${scan.type} · ${statusText}` : statusText,
                      timestamp: scan.date,
                      tone:
                        scan.clinicalStatus === "critical" || scan.priority === "high"
                          ? "red"
                          : scan.clinicalStatus === "stable"
                            ? "sage"
                            : "cream",
                    };
                  })}
                />
              </PneumoCard>
            </div>
          </div>

          {/* Recent Activity — Open Editorial List */}
          <ActivityList
            title={labels.recentActivityTitle}
            emptyMessage={
              locale === "ar"
                ? "لا يوجد نشاط سريري مسجل حتى الآن."
                : "No clinical activity recorded yet."
            }
            items={recentActivity.map((activity, idx) => ({
              id: String(activity.id),
              title: activity.action,
              timestamp: activity.time,
              tone: ["red", "cream", "sage", "olive"][idx % 4],
            }))}
          />
        </div>
      </div>
    </>
  );
}

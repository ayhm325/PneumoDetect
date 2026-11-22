// app/[locale]/patient/dashboard/page.js

// ---- Client Component Wrapper ----
"use client";

// ---- Server Component Part ----
// منع الكاش
export const headers = () => {
  return [["Cache-Control", "no-store"]];
};

import { ArrowUpIcon, CalendarDaysIcon, FileHeartIcon, FileTextIcon, HeartPulseIcon, MailIcon, MessagesSquareIcon, ScanLineIcon } from "lucide-react";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "@/lib/compat/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { useTranslations, useLocale } from "@/lib/compat/intl";
import PatientDashboardWrapper from "@/components/PatientDashboardWrapper";
import useSocket from "@/components/chat/useSocket.client";
import { apiFetch, apiRequest } from "@/lib/apiClient";
import { Button, StatCard, Surface } from "@/components/ui";
import { PageHeader } from "@/components/ui/PageHeader";

export default function PatientDashboardPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("patient");
  const ui = useTranslations("ui");
  const basePrefix = locale === "en" ? "/en" : "/ar";
  const placeholder = ui("placeholder");
  const commaSpace = ui("punctuation.commaSpace");

  const socket = useSocket();
  const seenMessageKeysRef = useRef(new Set());

  const [patientName, setPatientName] = useState("");
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const formatClinicalStatus = useCallback(
    (value) => {
      const raw = value == null ? "" : String(value).trim();
      if (!raw) return placeholder;
      const key = raw.toLowerCase();
      if (key === "stable" || key === "critical" || key === "recovering") {
        try {
          return t(`dashboard.clinicalStatuses.${key}`);
        } catch {
          // fall through
        }
      }
      return placeholder;
    },
    [t, placeholder],
  );

  // تحويل الأرقام العربية إلى 0123456789
  function toWesternDigits(str) {
    return str.replace(
      /[\u0660-\u0669]/g,
      (d) => "0123456789"[d.charCodeAt(0) - 0x0660],
    );
  }

  let today = new Date().toLocaleDateString(
    locale === "ar" ? "ar-JO" : "en-US",
    { dateStyle: "full" },
  );
  if (locale === "ar") today = toWesternDigits(today);

  /* ===================== STATS ===================== */
  const [stats, setStats] = useState([
    {
      title: t("dashboard.stats.upcomingAppointments"),
      value: placeholder,
      change: null,
      icon: CalendarDaysIcon,
    },
    {
      title: t("dashboard.stats.readyReports"),
      value: placeholder,
      change: null,
      icon: FileTextIcon,
    },
    {
      title: t("dashboard.stats.newMessages"),
      value: placeholder,
      change: null,
      icon: MailIcon,
    },
    {
      title: t("dashboard.stats.vitalSigns"),
      value: placeholder,
      icon: HeartPulseIcon,
    },
  ]);

  // Unread notifications count
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        const data = await apiRequest("/api/patient/dashboard-stats");
        if (!mounted || !data) return;
        setStats([
          {
            title: t("dashboard.stats.upcomingAppointments"),
            value: data.upcomingAppointments ?? placeholder,
            change: null,
            icon: CalendarDaysIcon,
          },
          {
            title: t("dashboard.stats.readyReports"),
            value: data.readyReports ?? placeholder,
            change: null,
            icon: FileTextIcon,
          },
          {
            title: t("dashboard.stats.newMessages"),
            value: data.newMessages ?? placeholder,
            change: null,
            icon: MailIcon,
          },
          {
            title: t("dashboard.stats.vitalSigns"),
            value: formatClinicalStatus(data.clinicalStatus),
            icon: HeartPulseIcon,
          },
        ]);
      } catch {}
    }
    const refresh = () => fetchStats();
    const onVis = () => {
      if (typeof document !== "undefined" && !document.hidden) fetchStats();
    };

    fetchStats();
    try {
      window.addEventListener("focus", refresh);
      document.addEventListener("visibilitychange", onVis);
    } catch {}

    return () => {
      mounted = false;
      try {
        window.removeEventListener("focus", refresh);
        document.removeEventListener("visibilitychange", onVis);
      } catch {}
    };
  }, [formatClinicalStatus, t, placeholder]);

  // Live increment: receive messages via user room (no chat join needed).
  useEffect(() => {
    if (!socket || !socket.onMessage) return;
    const off = socket.onMessage((msg) => {
      try {
        if (!msg) return;
        // Patient unread count = incoming from doctor.
        if (msg.sender === "doctor") {
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
          setStats((prev) => {
            if (!Array.isArray(prev) || prev.length < 3) return prev;
            const next = [...prev];
            const current = next[2] || {
              title: t("dashboard.stats.newMessages"),
              value: 0,
              change: null,
              icon: MailIcon,
            };
            const raw = current.value;
            const n = typeof raw === "number" ? raw : Number(raw);
            const base = Number.isFinite(n) ? n : 0;
            next[2] = { ...current, value: base + 1 };
            return next;
          });
        }
      } catch (e) {}
    });
    return () => {
      try {
        off && off();
      } catch (e) {}
    };
  }, [socket, t]);

  // Fetch unread notifications count
  useEffect(() => {
    let mounted = true;
    async function fetchUnreadCount() {
      try {
        const res = await apiFetch("/api/patient/notifications", {
          method: "HEAD",
        });
        if (res.ok) {
          const count = res.headers.get("X-Unread-Count");
          if (mounted) setUnreadCount(Number(count) || 0);
        }
      } catch {}
    }
    const refresh = () => fetchUnreadCount();
    const onVis = () => {
      if (typeof document !== "undefined" && !document.hidden)
        fetchUnreadCount();
    };

    fetchUnreadCount();
    try {
      window.addEventListener("focus", refresh);
      document.addEventListener("visibilitychange", onVis);
    } catch {}

    return () => {
      mounted = false;
      try {
        window.removeEventListener("focus", refresh);
        document.removeEventListener("visibilitychange", onVis);
      } catch {}
    };
  }, []);

  // Fetch patient name for header
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiRequest("/api/patient/profile");
        const name = (data?.profile?.fullName || "").trim();
        if (mounted) setPatientName(name);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch recent analyses & upcoming appointments for patient overview
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [histData, apptData] = await Promise.all([
          apiRequest("/api/analysis/history?limit=3").catch(() => null),
          apiRequest("/api/patient/appointments").catch(() => null),
        ]);
        if (!mounted) return;
        if (histData) {
          setRecentAnalyses(Array.isArray(histData?.data) ? histData.data.slice(0, 3) : []);
        }
        if (apptData) {
          const list = Array.isArray(apptData?.appointments) ? apptData.appointments : [];
          setUpcomingAppointments(list.slice(0, 3));
        }
      } finally {
        if (mounted) setOverviewLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ===================== QUICK ACTIONS ===================== */
  const quickActions = [
    {
      title: t("dashboard.quickActions.bookAppointment"),
      desc: t("dashboard.quickActions.desc.bookAppointment"),
      Icon: CalendarDaysIcon,
      href: "/patient/appointments",
    },
    {
      title: t("dashboard.quickActions.uploadXray"),
      desc: t("dashboard.quickActions.desc.uploadXray"),
      Icon: ScanLineIcon,
      href: "/patient/analysis",
    },
    {
      title: t("dashboard.quickActions.viewReports"),
      desc: t("dashboard.quickActions.desc.viewReports"),
      Icon: FileHeartIcon,
      href: "/patient/results",
    },
    {
      title: t("dashboard.quickActions.chatDoctor"),
      desc: t("dashboard.quickActions.desc.chatDoctor"),
      Icon: MessagesSquareIcon,
      href: "/patient/chat",
    },
  ];

  return (
    <PatientDashboardWrapper>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title={`${t("dashboard.welcome")}${patientName ? `${commaSpace}${patientName}` : ""}`}
          description={today}
        />

        {/* Stats — orbital + editorial rhythm (no 4 identical boxes) */}
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => {
            const StatIcon = s.icon;
            const tone = i === 1 ? "success" : i === 2 ? "warning" : "info";
            const shape = i === 0 ? "orbital" : i === 3 ? "layered" : "editorial";
            return (
              <StatCard
                key={i}
                label={s.title}
                value={s.value}
                icon={<StatIcon size={18} strokeWidth={1.7} />}
                tone={tone}
                shape={shape}
              />
            );
          })}
        </div>

        {/* Recent Analyses (asymmetric panel + open list) & Upcoming Appointments (frameless timeline) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <Surface shape="asymmetric" className="p-6 lg:col-span-7">
            <div className="mb-5 flex items-center justify-between border-b border-[var(--pd-border)] pb-4">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-[var(--pd-text-primary)]">
                <ScanLineIcon size={18} strokeWidth={1.7} className="text-[var(--pd-copper)]" />
                <span>{locale === "ar" ? "أحدث تحليلات الأشعة" : "Recent X-Ray Analyses"}</span>
              </h2>
              <button
                type="button"
                onClick={() => router.push(`${basePrefix}/patient/analysis/history`)}
                className="pd-btn pd-btn--link text-xs"
              >
                {locale === "ar" ? "عرض السجل" : "View history"}
              </button>
            </div>

            {overviewLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="pd-skeleton h-14 rounded-xl" />
                ))}
              </div>
            ) : recentAnalyses.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-[var(--pd-text-muted)]">
                  {locale === "ar" ? "لا توجد تحليلات أشعة مسجلة بعد." : "No X-ray analyses recorded yet."}
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push(`${basePrefix}/patient/analysis`)}
                >
                  {t("dashboard.quickActions.uploadXray")}
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--pd-border)]">
                {recentAnalyses.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--pd-text-primary)]">
                        {item.prediction || (locale === "ar" ? "نتيجة تحليل" : "Analysis Result")}
                      </p>
                      <p className="pd-tabular text-xs text-[var(--pd-text-muted)]">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "ar-EG")
                          : placeholder}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`${basePrefix}/patient/results`)}
                    >
                      {locale === "ar" ? "التفاصيل" : "Details"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Surface>

          <Surface shape="editorial" className="pt-5 lg:col-span-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-[var(--pd-text-primary)]">
                <CalendarDaysIcon size={18} strokeWidth={1.7} className="text-[var(--pd-sage)]" />
                <span>{locale === "ar" ? "المواعيد القادمة" : "Upcoming Appointments"}</span>
              </h2>
              <button
                type="button"
                onClick={() => router.push(`${basePrefix}/patient/appointments`)}
                className="pd-btn pd-btn--link text-xs"
              >
                {locale === "ar" ? "كل المواعيد" : "All appointments"}
              </button>
            </div>

            {overviewLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="pd-skeleton h-14 rounded-xl" />
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="py-6">
                <p className="text-sm text-[var(--pd-text-muted)]">
                  {locale === "ar" ? "لا توجد مواعيد محجوزة حالياً." : "No appointments scheduled yet."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push(`${basePrefix}/patient/appointments`)}
                >
                  {t("dashboard.quickActions.bookAppointment")}
                </Button>
              </div>
            ) : (
              <ol className="relative space-y-5 border-s border-[var(--pd-border-strong)] ps-5">
                {upcomingAppointments.map((appt) => (
                  <li key={appt.id} className="relative flex items-start justify-between gap-3">
                    <span
                      aria-hidden="true"
                      className="absolute -start-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--pd-copper)] ring-4 ring-[var(--pd-bg)]"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--pd-text-primary)]">
                        {appt.doctorName || appt.doctor?.user?.fullName || (locale === "ar" ? "موعد طبي" : "Medical Visit")}
                      </p>
                      <p className="pd-tabular text-xs text-[var(--pd-text-muted)]">
                        {appt.scheduledAt
                          ? new Date(appt.scheduledAt).toLocaleString(locale === "en" ? "en-US" : "ar-EG")
                          : placeholder}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[var(--pd-copper-border)] bg-[var(--pd-copper-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--pd-copper)]">
                      {appt.status || "scheduled"}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Surface>
        </div>

        {/* Quick Actions — 1 sculpted focal action + 3 frameless editorial links */}
        <div className="pt-2">
          <h2 className="mb-5 text-lg font-semibold text-[var(--pd-text-primary)]">
            {t("dashboard.quickActions.title")}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((a, i) => {
              const ActionIcon = a.Icon;
              const isPrimaryAction = i === 1;
              return (
                <Surface
                  key={i}
                  shape={isPrimaryAction ? "layered" : "editorial"}
                  tone={isPrimaryAction ? "copper" : "default"}
                  interactive
                  onClick={() => router.push(`${basePrefix}${a.href}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`${basePrefix}${a.href}`);
                    }
                  }}
                  className={`group flex cursor-pointer flex-col justify-between gap-3 ${
                    isPrimaryAction ? "p-5" : "pt-5"
                  }`}
                >
                  <div className={`pd-orb pd-shape-orbital ${isPrimaryAction ? "pd-orb--solid" : "pd-orb--copper"}`}>
                    <ActionIcon size={18} strokeWidth={1.7} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--pd-text-primary)]">
                      {a.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--pd-text-muted)]">
                      {a.desc}
                    </p>
                  </div>
                </Surface>
              );
            })}
          </div>
        </div>
      </div>
    </PatientDashboardWrapper>
  );
}
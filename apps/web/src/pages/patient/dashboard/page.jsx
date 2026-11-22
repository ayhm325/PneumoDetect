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
import { ActivityList, Button, FeatureCard, MetricCard, PneumoCard, QuickActionCard } from "@/components/ui";
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

        {/* Top Asymmetric Bento: Primary AI Screening Feature + 2x2 Metric Cluster */}
        <div className="pd-bento-grid">
          <div className="pd-span-5">
            <FeatureCard
              eyebrow={locale === "ar" ? "الفحص الذكي" : "AI Screening"}
              title={quickActions[1].title}
              description={quickActions[1].desc}
              icon={quickActions[1].Icon}
              tone="red"
              actionLabel={quickActions[1].title}
              onAction={() => router.push(`${basePrefix}${quickActions[1].href}`)}
              className="h-full"
            />
          </div>

          <div className="pd-span-7">
            <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2">
              {stats.map((s, i) => {
                const tones = ["cream", "sage", "olive", "cream"];
                const layouts = ["editorial", "visual", "compact", "editorial"];
                return (
                  <MetricCard
                    key={i}
                    id={`patient-stat-${i}`}
                    label={s.title}
                    value={s.value}
                    icon={s.icon}
                    tone={tones[i % tones.length]}
                    layout={layouts[i % layouts.length]}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Analyses (Olive Bento Card + ActivityList) & Upcoming Appointments (Open Editorial List) */}
        <div className="pd-bento-grid">
          <div className="pd-span-7">
            <PneumoCard tone="olive" hover={false}>
              {overviewLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="pd-skeleton h-14 rounded-xl" />
                  ))}
                </div>
              ) : recentAnalyses.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm font-medium">
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
                <ActivityList
                  title={locale === "ar" ? "أحدث تحليلات الأشعة" : "Recent X-Ray Analyses"}
                  headerAction={
                    <button
                      type="button"
                      onClick={() => router.push(`${basePrefix}/patient/analysis/history`)}
                      className="text-xs font-semibold underline underline-offset-4 opacity-90 hover:opacity-100"
                    >
                      {locale === "ar" ? "عرض السجل" : "View history"}
                    </button>
                  }
                  items={recentAnalyses.map((item, idx) => ({
                    id: String(item.id || idx),
                    title: item.prediction || (locale === "ar" ? "نتيجة تحليل" : "Analysis Result"),
                    timestamp: item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "ar-EG")
                      : placeholder,
                    tone: idx === 0 ? "red" : "cream",
                    actionLabel: locale === "ar" ? "التفاصيل" : "Details",
                    onAction: () => router.push(`${basePrefix}/patient/results`),
                  }))}
                />
              )}
            </PneumoCard>
          </div>

          <div className="pd-span-5">
            <PneumoCard tone="cream" hover={false} className="h-full">
              {overviewLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="pd-skeleton h-14 rounded-xl" />
                  ))}
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="py-6">
                  <h3 className="mb-3 text-lg font-medium">
                    {locale === "ar" ? "المواعيد القادمة" : "Upcoming Appointments"}
                  </h3>
                  <p className="text-sm opacity-80">
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
                <ActivityList
                  title={locale === "ar" ? "المواعيد القادمة" : "Upcoming Appointments"}
                  headerAction={
                    <button
                      type="button"
                      onClick={() => router.push(`${basePrefix}/patient/appointments`)}
                      className="text-xs font-medium underline underline-offset-4 opacity-85 hover:opacity-100"
                    >
                      {locale === "ar" ? "كل المواعيد" : "All appointments"}
                    </button>
                  }
                  items={upcomingAppointments.map((appt, idx) => ({
                    id: String(appt.id || idx),
                    title: appt.doctorName || appt.doctor?.user?.fullName || (locale === "ar" ? "موعد طبي" : "Medical Visit"),
                    description: appt.status || "scheduled",
                    timestamp: appt.scheduledAt
                      ? new Date(appt.scheduledAt).toLocaleDateString(locale === "en" ? "en-US" : "ar-EG")
                      : placeholder,
                    tone: idx === 0 ? "red" : "sage",
                  }))}
                />
              )}
            </PneumoCard>
          </div>
        </div>

        {/* Secondary Quick Actions — 3-column Bento Row */}
        <div className="pt-2">
          <h2 className="mb-4 text-lg font-medium text-[var(--pd-text-primary)]">
            {t("dashboard.quickActions.title")}
          </h2>
          <div className="pd-bento-grid">
            {quickActions
              .filter((_, i) => i !== 1)
              .map((a, i) => {
                const tones = ["cream", "sage", "olive"];
                return (
                  <div key={a.href} className="pd-span-4">
                    <QuickActionCard
                      title={a.title}
                      description={a.desc}
                      icon={a.Icon}
                      tone={tones[i % tones.length]}
                      onClick={() => router.push(`${basePrefix}${a.href}`)}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </PatientDashboardWrapper>
  );
}
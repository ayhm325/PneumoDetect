// app/[locale]/patient/dashboard/page.js

// ---- Client Component Wrapper ----
"use client";

// ---- Server Component Part ----
// منع الكاش
export const headers = () => {
  return [["Cache-Control", "no-store"]];
};

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "@/lib/compat/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import {
  FaCalendarAlt,
  FaComments,
  FaFileAlt,
  FaFileMedicalAlt,
  FaEnvelope,
  FaHeartbeat,
  FaArrowUp,
  FaXRay,
} from "react-icons/fa";
import { useTranslations, useLocale } from "@/lib/compat/intl";
import PatientDashboardWrapper from "@/components/PatientDashboardWrapper";
import useSocket from "@/components/chat/useSocket.client";
import { Button, Card, StatCard } from "@/components/ui";
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
      icon: FaCalendarAlt,
    },
    {
      title: t("dashboard.stats.readyReports"),
      value: placeholder,
      change: null,
      icon: FaFileAlt,
    },
    {
      title: t("dashboard.stats.newMessages"),
      value: placeholder,
      change: null,
      icon: FaEnvelope,
    },
    {
      title: t("dashboard.stats.vitalSigns"),
      value: placeholder,
      icon: FaHeartbeat,
    },
  ]);

  // Unread notifications count
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        const res = await fetch("/api/patient/dashboard-stats", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setStats([
          {
            title: t("dashboard.stats.upcomingAppointments"),
            value: data.upcomingAppointments ?? placeholder,
            change: null,
            icon: FaCalendarAlt,
          },
          {
            title: t("dashboard.stats.readyReports"),
            value: data.readyReports ?? placeholder,
            change: null,
            icon: FaFileAlt,
          },
          {
            title: t("dashboard.stats.newMessages"),
            value: data.newMessages ?? placeholder,
            change: null,
            icon: FaEnvelope,
          },
          {
            title: t("dashboard.stats.vitalSigns"),
            value: formatClinicalStatus(data.clinicalStatus),
            icon: FaHeartbeat,
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
              icon: FaEnvelope,
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
        const res = await fetch("/api/patient/notifications", {
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
        const res = await fetch("/api/patient/profile", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
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
        const [histRes, apptRes] = await Promise.all([
          fetch("/api/analysis/history?limit=3", { credentials: "include" }).catch(() => null),
          fetch("/api/patient/appointments", { credentials: "include" }).catch(() => null),
        ]);
        if (!mounted) return;
        if (histRes?.ok) {
          const histData = await histRes.json().catch(() => ({}));
          setRecentAnalyses(Array.isArray(histData?.data) ? histData.data.slice(0, 3) : []);
        }
        if (apptRes?.ok) {
          const apptData = await apptRes.json().catch(() => ({}));
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
      Icon: FaCalendarAlt,
      href: "/patient/appointments",
    },
    {
      title: t("dashboard.quickActions.uploadXray"),
      desc: t("dashboard.quickActions.desc.uploadXray"),
      Icon: FaXRay,
      href: "/patient/analysis",
    },
    {
      title: t("dashboard.quickActions.viewReports"),
      desc: t("dashboard.quickActions.desc.viewReports"),
      Icon: FaFileMedicalAlt,
      href: "/patient/results",
    },
    {
      title: t("dashboard.quickActions.chatDoctor"),
      desc: t("dashboard.quickActions.desc.chatDoctor"),
      Icon: FaComments,
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {stats.map((s, i) => {
            const StatIcon = s.icon;
            const tone =
              i === 1 ? "success" : i === 2 ? "warning" : "info";
            return (
              <StatCard
                key={i}
                label={s.title}
                value={s.value}
                icon={<StatIcon />}
                tone={tone}
              />
            );
          })}
        </div>

        {/* Recent Analyses & Upcoming Appointments */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-(--ui-foreground)">
                <FaXRay className="text-(--color-primary-500)" />
                <span>{locale === "ar" ? "أحدث تحليلات الأشعة" : "Recent X-Ray Analyses"}</span>
              </h2>
              <button
                type="button"
                onClick={() => router.push(`${basePrefix}/patient/analysis/history`)}
                className="text-xs font-semibold text-(--color-primary-500) hover:underline"
              >
                {locale === "ar" ? "عرض السجل" : "View history"}
              </button>
            </div>

            {overviewLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-(--ui-surface-2)" />
                ))}
              </div>
            ) : recentAnalyses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-(--ui-border) bg-(--ui-surface-2)/40 p-6 text-center">
                <p className="text-sm font-medium text-(--ui-muted-foreground)">
                  {locale === "ar" ? "لا توجد تحليلات أشعة مسجلة بعد." : "No X-ray analyses recorded yet."}
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push(`${basePrefix}/patient/analysis`)}
                >
                  {t("dashboard.quickActions.uploadXray")}
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentAnalyses.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-(--ui-border) bg-(--ui-surface-2)/50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-(--ui-foreground)">
                        {item.prediction || (locale === "ar" ? "نتيجة تحليل" : "Analysis Result")}
                      </p>
                      <p className="text-xs text-(--ui-muted-foreground)">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "ar-EG")
                          : placeholder}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => router.push(`${basePrefix}/patient/results`)}
                    >
                      {locale === "ar" ? "التفاصيل" : "Details"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-(--ui-foreground)">
                <FaCalendarAlt className="text-(--color-secondary-500)" />
                <span>{locale === "ar" ? "المواعيد القادمة" : "Upcoming Appointments"}</span>
              </h2>
              <button
                type="button"
                onClick={() => router.push(`${basePrefix}/patient/appointments`)}
                className="text-xs font-semibold text-(--color-primary-500) hover:underline"
              >
                {locale === "ar" ? "كل المواعيد" : "All appointments"}
              </button>
            </div>

            {overviewLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-(--ui-surface-2)" />
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-(--ui-border) bg-(--ui-surface-2)/40 p-6 text-center">
                <p className="text-sm font-medium text-(--ui-muted-foreground)">
                  {locale === "ar" ? "لا توجد مواعيد محجوزة حالياً." : "No appointments scheduled yet."}
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push(`${basePrefix}/patient/appointments`)}
                >
                  {t("dashboard.quickActions.bookAppointment")}
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between rounded-xl border border-(--ui-border) bg-(--ui-surface-2)/50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-(--ui-foreground)">
                        {appt.doctorName || appt.doctor?.user?.fullName || (locale === "ar" ? "موعد طبي" : "Medical Visit")}
                      </p>
                      <p className="text-xs text-(--ui-muted-foreground)">
                        {appt.scheduledAt
                          ? new Date(appt.scheduledAt).toLocaleString(locale === "en" ? "en-US" : "ar-EG")
                          : placeholder}
                      </p>
                    </div>
                    <span className="rounded-full bg-(--ui-info-bg) px-2.5 py-1 text-xs font-semibold text-(--ui-info)">
                      {appt.status || "scheduled"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-(--ui-foreground)">
            {t("dashboard.quickActions.title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((a, i) => {
              const ActionIcon = a.Icon;
              return (
                <Card
                  key={i}
                  variant="interactive"
                  size="sm"
                  onClick={() => router.push(`${basePrefix}${a.href}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`${basePrefix}${a.href}`);
                    }
                  }}
                  className="group cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-(--ui-info-border) bg-(--ui-info-bg) text-(--color-primary) text-xl">
                    <ActionIcon />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-(--ui-foreground)">
                      {a.title}
                    </h3>
                    <p className="mt-1 text-xs text-(--ui-muted-foreground) leading-relaxed">
                      {a.desc}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </PatientDashboardWrapper>
  );
}
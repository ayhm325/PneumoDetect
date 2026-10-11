// app/[locale]/patient/dashboard/page.js

// ---- Client Component Wrapper ----
"use client";

// ---- Server Component Part ----
// منع الكاش
export const headers = () => {
  return [["Cache-Control", "no-store"]];
};

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../components/ui/ToastProvider";
import {
  FaCalendarAlt,
  FaFileAlt,
  FaEnvelope,
  FaHeartbeat,
  FaArrowUp,
} from "react-icons/fa";
import { useTranslations, useLocale } from "next-intl";
import PatientDashboardWrapper from "../../../components/PatientDashboardWrapper";
import NotificationBellButton from "../../../components/ui/NotificationBellButton";
import useSocket from "../../../components/chat/useSocket.client";
import { Button, Card } from "../../../../src/components/ui";

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

  /* ===================== QUICK ACTIONS ===================== */
  const quickActions = [
    {
      title: t("dashboard.quickActions.bookAppointment"),
      desc: t("dashboard.quickActions.desc.bookAppointment"),
      icon: "📅",
      href: "/patient/appointments",
    },
    {
      title: t("dashboard.quickActions.uploadXray"),
      desc: t("dashboard.quickActions.desc.uploadXray"),
      icon: "🩻",
      href: "/patient/analysis",
    },
    {
      title: t("dashboard.quickActions.viewReports"),
      desc: t("dashboard.quickActions.desc.viewReports"),
      icon: "📋",
      href: "/patient/results",
    },
    {
      title: t("dashboard.quickActions.chatDoctor"),
      desc: t("dashboard.quickActions.desc.chatDoctor"),
      icon: "💬",
      href: "/patient/chat",
    },
  ];

  return (
    <PatientDashboardWrapper>
      <div className="min-h-screen bg-(--ui-surface) text-(--ui-foreground) p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-(--ui-foreground)">
              {t("dashboard.welcome")}
              {patientName ? `${commaSpace}${patientName}` : ""} 👋
            </h1>
            <p className="text-(--ui-muted-foreground) mt-2">{today}</p>
          </div>

          <NotificationBellButton
            count={unreadCount}
            onClick={() => router.push(`${basePrefix}/patient/notifications`)}
            title={ui("topbar.notifications")}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {stats.map((s, i) => (
            <Card key={i} variant="interactive" size="sm">
              <div
                className={`flex items-center gap-3 justify-center mb-2 ${locale === "ar" ? "flex-row-reverse" : "flex-row"}`}
              >
                <s.icon
                  className={`text-4xl text-(--ui-info) ${locale === "ar" ? "order-2" : "order-1"}`}
                />
                <p className="text-lg font-semibold text-(--ui-muted-foreground) text-center w-full">
                  {s.title}
                </p>
              </div>
              <p className="mt-1 text-3xl font-semibold text-center">
                {s.value}
              </p>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-2xl font-bold mb-4">
          {t("dashboard.quickActions.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {quickActions.map((a, i) => (
            <Button
              key={i}
              onClick={() => router.push(`${basePrefix}${a.href}`)}
              size="lg"
              className="h-auto min-h-[136px] flex-col items-start rounded-xl p-6 text-start"
            >
              <div className="text-4xl mb-3">{a.icon}</div>
              <h3 className="font-bold">{a.title}</h3>
              <p className="text-sm opacity-90">{a.desc}</p>
            </Button>
          ))}
        </div>
      </div>
    </PatientDashboardWrapper>
  );
}

"use client";

import DoctorLayout from "../DoctorLayout";
import { useToast } from "@/components/ui/ToastProvider";
import { useEffect, useMemo, useState } from "react";
import {
  FaUserInjured,
  FaXRay,
  FaCheckCircle,
  FaClock,
  FaChartLine,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaDownload,
  FaEye,
} from "react-icons/fa";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import { Card, GlideSelect } from "@/components/ui";

export default function Page() {
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const t = useTranslations("doctorAnalytics");
  const locale = useLocale();
  const [timeRange, setTimeRange] = useState("week");
  const [selectedMetric, setSelectedMetric] = useState("patients");

  const [patientsData, setPatientsData] = useState([]);
  const [resultsData, setResultsData] = useState([]);
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [referenceNow] = useState(() => Date.now());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [pRes, rRes, aRes] = await Promise.all([
          fetch("/api/doctor/patients", { credentials: "include" }),
          fetch("/api/doctor/results", { credentials: "include" }),
          fetch("/api/doctor/appointments", { credentials: "include" }),
        ]);
        const [pJson, rJson, aJson] = await Promise.all([
          pRes.ok ? pRes.json().catch(() => ({})) : {},
          rRes.ok ? rRes.json().catch(() => ({})) : {},
          aRes.ok ? aRes.json().catch(() => ({})) : {},
        ]);
        if (!mounted) return;
        setPatientsData(Array.isArray(pJson?.patients) ? pJson.patients : []);
        setResultsData(Array.isArray(rJson?.results) ? rJson.results : Array.isArray(rJson?.data) ? rJson.data : []);
        setAppointmentsData(Array.isArray(aJson?.appointments) ? aJson.appointments : []);
      } catch {
        // Keep empty arrays on error
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const currentStats = useMemo(() => {
    const now = referenceNow;
    const rangeDays = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 365;
    const rangeMs = rangeDays * 24 * 60 * 60 * 1000;
    const inCurrent = (dt) => {
      const ts = dt ? new Date(dt).getTime() : 0;
      return ts >= now - rangeMs;
    };
    const inPrev = (dt) => {
      const ts = dt ? new Date(dt).getTime() : 0;
      return ts >= now - 2 * rangeMs && ts < now - rangeMs;
    };
    const pct = (curr, prev) => (prev === 0 ? (curr > 0 ? 100 : 0) : Number((((curr - prev) / prev) * 100).toFixed(1)));

    const currPatients = patientsData.filter((p) => inCurrent(p.createdAt)).length || patientsData.length;
    const prevPatients = patientsData.filter((p) => inPrev(p.createdAt)).length;

    const currScans = resultsData.filter((r) => inCurrent(r.createdAt)).length;
    const prevScans = resultsData.filter((r) => inPrev(r.createdAt)).length;

    const isDone = (r) => r.reviewedByDoctor || r.status === "completed" || r.status === "reviewed";
    const currCompleted = resultsData.filter((r) => inCurrent(r.createdAt) && isDone(r)).length;
    const prevCompleted = resultsData.filter((r) => inPrev(r.createdAt) && isDone(r)).length;

    const currPending = resultsData.filter((r) => inCurrent(r.createdAt) && !isDone(r)).length;
    const prevPending = resultsData.filter((r) => inPrev(r.createdAt) && !isDone(r)).length;

    return {
      patients: { current: currPatients, previous: prevPatients, percentage: pct(currPatients, prevPatients) },
      scans: { current: currScans, previous: prevScans, percentage: pct(currScans, prevScans) },
      completed: { current: currCompleted, previous: prevCompleted, percentage: pct(currCompleted, prevCompleted) },
      pending: { current: currPending, previous: prevPending, percentage: pct(currPending, prevPending) },
    };
  }, [patientsData, resultsData, timeRange, referenceNow]);

  // Chart Data - Patient Distribution by Day
  const patientChartDataTemplate = useMemo(() => {
    const raw = t("patientChartData", { returnObjects: true });
    return Array.isArray(raw) ? raw : [];
  }, [t]);

  const patientChartData = useMemo(() => {
    if (patientChartDataTemplate.length === 0) return [];
    const counts = new Array(patientChartDataTemplate.length).fill(0);
    for (const r of resultsData) {
      if (!r.createdAt) continue;
      const dayIdx = new Date(r.createdAt).getDay() % patientChartDataTemplate.length;
      counts[dayIdx] += 1;
    }
    return patientChartDataTemplate.map((item, idx) => ({
      ...item,
      value: counts[idx],
    }));
  }, [patientChartDataTemplate, resultsData]);

  const maxValue = Math.max(1, ...patientChartData.map((d) => d.value || 0));

  // Scan Types Distribution
  const scanTypesTemplate = useMemo(() => {
    const raw = t("scanTypes", { returnObjects: true });
    return Array.isArray(raw) ? raw : [];
  }, [t]);

  const scanTypes = scanTypesTemplate;

  // Recent Activity
  const recentActivity = useMemo(() => {
    const fromResults = resultsData.slice(0, 5).map((r, idx) => ({
      id: r.id || idx,
      patient: r.patientName || r.patient?.fullName || r.prediction || "—",
      action: r.prediction ? `${r.prediction} (${Math.round(Number(r.confidence || 0) * 100)}%)` : "X-Ray Analysis",
      time: r.createdAt ? new Date(r.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US") : "—",
    }));
    if (fromResults.length > 0) return fromResults;
    return appointmentsData.slice(0, 5).map((a, idx) => ({
      id: a.id || idx,
      patient: a.patientName || a.patient?.fullName || "—",
      action: a.status || "Appointment",
      time: a.scheduledAt ? new Date(a.scheduledAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US") : "—",
    }));
  }, [resultsData, appointmentsData, locale]);

  // Export removed: UI export button hidden per request.

  return (
    <DoctorLayout>
      <div className="min-h-screen bg-(--ui-surface-2) p-6 text-(--ui-foreground)">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-(--ui-foreground)">
                <FaChartLine className="text-(--ui-info)" />
                {t("title")}
              </h1>
              <p className="mt-2 text-(--ui-muted-foreground)">
                {t("subtitle")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Time Range Filter */}
              <GlideSelect
                value={timeRange}
                onChange={(val) => setTimeRange(val)}
                options={[
                  { value: "week", label: t("timeRange.week") },
                  { value: "month", label: t("timeRange.month") },
                  { value: "year", label: t("timeRange.year") },
                ]}
              />

              {/* Export button removed per request */}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Patients */}
            <Card variant="interactive" className="group relative overflow-hidden">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 transform rounded-full bg-(--ui-info)/10 transition-transform group-hover:scale-150"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <FaUserInjured className="text-4xl text-(--ui-info)" />
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      currentStats.patients.percentage > 0
                        ? "text-(--ui-success)"
                        : "text-(--ui-danger)"
                    }`}
                  >
                    {currentStats.patients.percentage > 0 ? (
                      <FaArrowUp />
                    ) : (
                      <FaArrowDown />
                    )}
                    {Math.abs(currentStats.patients.percentage)}%
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {t("stats.patients")}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-(--ui-foreground)">
                    {currentStats.patients.current}
                  </p>
                  <p className="mt-1 text-xs text-(--ui-muted-foreground)">
                    {t("stats.previous")}: {currentStats.patients.previous}
                  </p>
                </div>
              </div>
            </Card>

            {/* Total Scans */}
            <Card variant="interactive" className="group relative overflow-hidden">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 transform rounded-full bg-(--ui-info)/10 transition-transform group-hover:scale-150"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <FaXRay className="text-4xl text-(--ui-info)" />
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      currentStats.scans.percentage > 0
                        ? "text-(--ui-success)"
                        : "text-(--ui-danger)"
                    }`}
                  >
                    {currentStats.scans.percentage > 0 ? (
                      <FaArrowUp />
                    ) : (
                      <FaArrowDown />
                    )}
                    {Math.abs(currentStats.scans.percentage)}%
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {t("stats.scans")}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-(--ui-foreground)">
                    {currentStats.scans.current}
                  </p>
                  <p className="mt-1 text-xs text-(--ui-muted-foreground)">
                    {t("stats.previous")}: {currentStats.scans.previous}
                  </p>
                </div>
              </div>
            </Card>

            {/* Completed */}
            <Card variant="interactive" className="group relative overflow-hidden">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 transform rounded-full bg-(--ui-success)/10 transition-transform group-hover:scale-150"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <FaCheckCircle className="text-4xl text-(--ui-success)" />
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      currentStats.completed.percentage > 0
                        ? "text-(--ui-success)"
                        : "text-(--ui-danger)"
                    }`}
                  >
                    {currentStats.completed.percentage > 0 ? (
                      <FaArrowUp />
                    ) : (
                      <FaArrowDown />
                    )}
                    {Math.abs(currentStats.completed.percentage)}%
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {t("stats.completed")}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-(--ui-foreground)">
                    {currentStats.completed.current}
                  </p>
                  <p className="mt-1 text-xs text-(--ui-muted-foreground)">
                    {t("stats.previous")}: {currentStats.completed.previous}
                  </p>
                </div>
              </div>
            </Card>

            {/* Pending */}
            <Card variant="interactive" className="group relative overflow-hidden">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 transform rounded-full bg-(--ui-warning)/10 transition-transform group-hover:scale-150"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <FaClock className="text-4xl text-(--ui-warning)" />
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      currentStats.pending.percentage < 0
                        ? "text-(--ui-success)"
                        : "text-(--ui-danger)"
                    }`}
                  >
                    {currentStats.pending.percentage < 0 ? (
                      <FaArrowDown />
                    ) : (
                      <FaArrowUp />
                    )}
                    {Math.abs(currentStats.pending.percentage)}%
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {t("stats.pending")}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-(--ui-foreground)">
                    {currentStats.pending.current}
                  </p>
                  <p className="mt-1 text-xs text-(--ui-muted-foreground)">
                    {t("stats.previous")}: {currentStats.pending.previous}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Patient Distribution Chart */}
            <Card className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold text-(--ui-foreground)">
                  <FaCalendarAlt className="text-(--ui-info)" />
                  {t("chart.patientDistribution")}
                </h2>
              </div>

              <div className="space-y-4">
                {patientChartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium text-(--ui-foreground)">
                      {item.day}
                    </div>
                    <div className="flex-1">
                      <progress
                        value={item.value}
                        max={maxValue}
                        className="h-10 w-full overflow-hidden rounded-lg bg-(--ui-surface) [&::-webkit-progress-bar]:bg-(--ui-surface) [&::-webkit-progress-value]:bg-(--ui-info) [&::-moz-progress-bar]:bg-(--ui-info)"
                      />
                    </div>
                    <div className="w-12 text-sm text-(--ui-muted-foreground)">
                      {item.value} {t("units.patients")}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Scan Types Distribution */}
            <Card>
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-(--ui-foreground)">
                <FaXRay className="text-(--ui-info)" />
                {t("scanTypesTitle")}
              </h2>

              <div className="space-y-4">
                {scanTypes.map((scan, index) => (
                  <div key={index}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-(--ui-foreground)">
                        {scan.label}
                      </span>
                      <span className="text-sm font-bold text-(--ui-foreground)">
                        {scan.count}
                      </span>
                    </div>
                    <progress
                      value={scan.percentage}
                      max={100}
                      className="h-3 w-full overflow-hidden rounded-full bg-(--ui-surface) [&::-webkit-progress-bar]:bg-(--ui-surface) [&::-webkit-progress-value]:bg-(--ui-info) [&::-moz-progress-bar]:bg-(--ui-info)"
                    />
                    <p className="mt-1 text-xs text-(--ui-muted-foreground)">
                      {scan.percentage}% {t("scanTypesOfTotal")}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-(--ui-foreground)">
              <FaClock className="text-(--ui-info)" />
              {t("recentActivityTitle")}
            </h2>

            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-(--ui-border) p-4 transition-all hover:bg-(--ui-surface-2)"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        activity.status === "completed"
                          ? "bg-(--ui-success-bg)"
                          : activity.status === "pending"
                            ? "bg-(--ui-warning-bg)"
                            : activity.status === "sent"
                              ? "bg-(--ui-info-bg)"
                              : "bg-(--ui-info-bg)"
                      }`}
                    >
                      {activity.status === "completed" ? (
                        <FaCheckCircle className="text-(--ui-success)" />
                      ) : activity.status === "pending" ? (
                        <FaClock className="text-(--ui-warning)" />
                      ) : (
                        <FaEye className="text-(--ui-info)" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-(--ui-foreground)">
                        {activity.actionLabel}
                      </p>
                      <p className="text-sm text-(--ui-muted-foreground)">
                        {activity.patient}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-(--ui-muted-foreground)">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DoctorLayout>
  );
}
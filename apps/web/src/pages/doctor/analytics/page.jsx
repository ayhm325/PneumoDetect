"use client";

import { ArrowDownIcon, ArrowUpIcon, CalendarDaysIcon, ChartLineIcon, CircleCheckIcon, ClockIcon, DownloadIcon, EyeIcon, ScanLineIcon, UserRoundIcon } from "lucide-react";
import DoctorLayout from "../DoctorLayout";
import { useToast } from "@/components/ui/ToastProvider";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import { apiRequest } from "@/lib/apiClient";
import { ActivityList, ChartCard, GlideSelect, MetricCard, PneumoCard } from "@/components/ui";

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
        const [pJson, rJson, aJson] = await Promise.all([
          apiRequest("/api/doctor/patients").catch(() => ({})),
          apiRequest("/api/doctor/results").catch(() => ({})),
          apiRequest("/api/doctor/appointments").catch(() => ({})),
        ]);
        if (!mounted) return;
        setPatientsData(Array.isArray(pJson?.patients) ? pJson.patients : []);
        setResultsData(
          Array.isArray(rJson?.records)
            ? rJson.records
            : Array.isArray(rJson?.results)
              ? rJson.results
              : Array.isArray(rJson?.data)
                ? rJson.data
                : [],
        );
        setAppointmentsData(
          Array.isArray(aJson?.appointments) ? aJson.appointments : [],
        );
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
                <ChartLineIcon className="text-(--ui-info)" />
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

          {/* Top Asymmetric Bento: Prominent Chart + Stacked Key Metrics */}
          <div className="pd-bento-grid">
            <div className="pd-span-8">
              <ChartCard
                title={t("chart.patientDistribution")}
                tone="cream"
                headerAction={<CalendarDaysIcon size={20} strokeWidth={1.7} aria-hidden="true" />}
                className="h-full"
              >
                <div className="space-y-4">
                  {patientChartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-20 text-sm font-medium">{item.day}</div>
                      <div className="flex-1">
                        <progress
                          value={item.value}
                          max={maxValue}
                          className="h-7 w-full overflow-hidden rounded-full bg-[var(--pd-ink)]/15 [&::-webkit-progress-bar]:bg-[var(--pd-ink)]/15 [&::-webkit-progress-value]:bg-[var(--pd-red)] [&::-moz-progress-bar]:bg-[var(--pd-red)]"
                        />
                      </div>
                      <div className="pd-tabular w-16 text-end text-sm font-medium">
                        {item.value} {t("units.patients")}
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>

            <div className="pd-span-4 flex flex-col gap-5">
              <MetricCard
                id="analytics-patients"
                label={t("stats.patients")}
                value={currentStats.patients.current}
                description={`${t("stats.previous")}: ${currentStats.patients.previous}`}
                icon={UserRoundIcon}
                tone="red"
                layout="editorial"
                trend={{
                  label: `${currentStats.patients.percentage > 0 ? "+" : "-"}${Math.abs(currentStats.patients.percentage)}%`,
                  direction: currentStats.patients.percentage > 0 ? "up" : "down",
                }}
              />
              <MetricCard
                id="analytics-scans"
                label={t("stats.scans")}
                value={currentStats.scans.current}
                description={`${t("stats.previous")}: ${currentStats.scans.previous}`}
                icon={ScanLineIcon}
                tone="olive"
                layout="visual"
                trend={{
                  label: `${currentStats.scans.percentage > 0 ? "+" : "-"}${Math.abs(currentStats.scans.percentage)}%`,
                  direction: currentStats.scans.percentage > 0 ? "up" : "down",
                }}
              />
            </div>
          </div>

          {/* Secondary Bento Row: Completed + Pending + Scan Types Distribution */}
          <div className="pd-bento-grid">
            <div className="pd-span-4">
              <MetricCard
                id="analytics-completed"
                label={t("stats.completed")}
                value={currentStats.completed.current}
                description={`${t("stats.previous")}: ${currentStats.completed.previous}`}
                icon={CircleCheckIcon}
                tone="sage"
                layout="compact"
                trend={{
                  label: `${currentStats.completed.percentage > 0 ? "+" : "-"}${Math.abs(currentStats.completed.percentage)}%`,
                  direction: currentStats.completed.percentage > 0 ? "up" : "down",
                }}
              />
            </div>

            <div className="pd-span-4">
              <MetricCard
                id="analytics-pending"
                label={t("stats.pending")}
                value={currentStats.pending.current}
                description={`${t("stats.previous")}: ${currentStats.pending.previous}`}
                icon={ClockIcon}
                tone="cream"
                layout="editorial"
                trend={{
                  label: `${currentStats.pending.percentage < 0 ? "-" : "+"}${Math.abs(currentStats.pending.percentage)}%`,
                  direction: currentStats.pending.percentage < 0 ? "down" : "up",
                }}
              />
            </div>

            <div className="pd-span-4">
              <PneumoCard tone="olive" hover={false} className="h-full">
                <h2 className="mb-5 flex items-center gap-2 text-base font-medium">
                  <ScanLineIcon size={18} strokeWidth={1.7} aria-hidden="true" />
                  <span>{t("scanTypesTitle")}</span>
                </h2>

                <div className="space-y-4">
                  {scanTypes.map((scan, index) => (
                    <div key={index}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium">{scan.label}</span>
                        <span className="pd-tabular font-medium">{scan.count}</span>
                      </div>
                      <progress
                        value={scan.percentage}
                        max={100}
                        className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--pd-cream)]/20 [&::-webkit-progress-bar]:bg-[var(--pd-cream)]/20 [&::-webkit-progress-value]:bg-[var(--pd-cream)] [&::-moz-progress-bar]:bg-[var(--pd-cream)]"
                      />
                      <p className="mt-1 text-xs opacity-80">
                        {scan.percentage}% {t("scanTypesOfTotal")}
                      </p>
                    </div>
                  ))}
                </div>
              </PneumoCard>
            </div>
          </div>

          {/* Recent Activity — Open Editorial List */}
          <ActivityList
            title={t("recentActivityTitle")}
            items={recentActivity.map((activity, index) => ({
              id: `doc-act-${index}`,
              title: activity.actionLabel,
              description: activity.patient,
              timestamp: activity.time,
              tone:
                activity.status === "completed"
                  ? "sage"
                  : activity.status === "pending"
                    ? "red"
                    : "cream",
            }))}
          />
        </div>
      </div>
    </DoctorLayout>
  );
}
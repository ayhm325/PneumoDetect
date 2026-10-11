"use client";

import DoctorLayout from "../DoctorLayout";
import { useToast } from "../../../components/ui/ToastProvider";
import { useMemo, useState } from "react";
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
import { useLocale, useTranslations } from "next-intl";
import { Card } from "../../../../src/components/ui";

export default function Page() {
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const t = useTranslations("doctorAnalytics");
  const locale = useLocale();
  const [timeRange, setTimeRange] = useState("week");
  const [selectedMetric, setSelectedMetric] = useState("patients");

  // Statistics Data
  const stats = {
    week: {
      patients: { current: 45, previous: 38, percentage: 18.4 },
      scans: { current: 62, previous: 55, percentage: 12.7 },
      completed: { current: 58, previous: 48, percentage: 20.8 },
      pending: { current: 4, previous: 7, percentage: -42.9 },
    },
    month: {
      patients: { current: 180, previous: 165, percentage: 9.1 },
      scans: { current: 245, previous: 220, percentage: 11.4 },
      completed: { current: 238, previous: 210, percentage: 13.3 },
      pending: { current: 7, previous: 10, percentage: -30.0 },
    },
    year: {
      patients: { current: 2160, previous: 1980, percentage: 9.1 },
      scans: { current: 2940, previous: 2640, percentage: 11.4 },
      completed: { current: 2856, previous: 2520, percentage: 13.3 },
      pending: { current: 84, previous: 120, percentage: -30.0 },
    },
  };

  const currentStats = stats[timeRange];

  // Chart Data - Patient Distribution by Day
  const patientChartDataTemplate = useMemo(
    () => t("patientChartData", { returnObjects: true }),
    [t],
  );

  const patientChartData = patientChartDataTemplate;

  const maxValue = Math.max(...patientChartData.map((d) => d.value));

  // Scan Types Distribution
  const scanTypesTemplate = useMemo(
    () => t("scanTypes", { returnObjects: true }),
    [t],
  );

  const scanTypes = scanTypesTemplate;

  // Recent Activity
  const recentActivityTemplate = useMemo(
    () => t("recentActivity", { returnObjects: true }),
    [t],
  );

  const recentActivity = recentActivityTemplate;

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
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="rounded-lg border border-(--ui-border) bg-(--ui-surface) px-4 py-2 text-sm font-medium text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
              >
                <option value="week">{t("timeRange.week")}</option>
                <option value="month">{t("timeRange.month")}</option>
                <option value="year">{t("timeRange.year")}</option>
              </select>

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

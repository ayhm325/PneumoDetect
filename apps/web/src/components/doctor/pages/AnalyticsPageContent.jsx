"use client";
import React from "react";
import AnalyticsCard from "../../../[locale]/doctor/components/AnalyticsCard";
import AnalyticsChart from "../../../[locale]/doctor/components/AnalyticsChart";
import AnalyticsSummary from "../../../[locale]/doctor/components/AnalyticsSummary";
import { FaUserInjured, FaXRay, FaTasks } from "react-icons/fa";
import { useTranslations } from "@/lib/compat/intl";

export default function AnalyticsPageContent() {
  const t = useTranslations("doctorAnalytics");

  const summaryStats = [
    { label: t("stats.patients"), value: 24 },
    { label: t("stats.scans"), value: 18 },
    { label: t("stats.pending"), value: 3 },
  ];

  const rawChartItems = t.raw("patientChartData");
  const chartItems = Array.isArray(rawChartItems) ? rawChartItems : [];
  const labels = chartItems
    .map((item) => (typeof item?.day === "string" ? item.day : null))
    .filter((value) => typeof value === "string");
  const values = chartItems
    .map((item) => (typeof item?.value === "number" ? item.value : null))
    .filter((value) => typeof value === "number");

  const chartData = {
    labels,
    datasets: [
      {
        label: t("patients"),
        data: values,
        backgroundColor: "var(--ui-info)",
      },
    ],
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <div className="flex gap-4">
        <AnalyticsCard
          title={t("patients")}
          value={24}
          icon={<FaUserInjured />}
          accent="var(--ui-info)"
        />
        <AnalyticsCard
          title={t("scans")}
          value={18}
          icon={<FaXRay />}
          accent="var(--ui-warning)"
        />
        <AnalyticsCard
          title={t("reports")}
          value={3}
          icon={<FaTasks />}
          accent="var(--ui-danger)"
        />
      </div>
      <AnalyticsSummary stats={summaryStats} />
      <div className="max-w-xl">
        <AnalyticsChart
          type="bar"
          data={chartData}
          options={{ responsive: true }}
        />
      </div>
    </div>
  );
}
import React from "react";
import DashboardCard from "./DashboardCard";
import { FaUsers, FaUserMd, FaUserInjured, FaChartBar } from "react-icons/fa";
import { useTranslations } from "@/lib/compat/intl";

export default function StatsGrid() {
  const t = useTranslations("adminDashboard");
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
      <DashboardCard
        icon={<FaUsers className="text-(--color-primary-500)" />}
        title={t("stats.totalUsers")}
        value={120}
        color="border-(--ui-border)"
      />
      <DashboardCard
        icon={<FaUserMd className="text-(--color-accent-500)" />}
        title={t("stats.doctors")}
        value={35}
        color="border-(--ui-border)"
      />
      <DashboardCard
        icon={<FaUserInjured className="text-(--color-dark-500)" />}
        title={t("stats.patients")}
        value={85}
        color="border-(--ui-border)"
      />
      <DashboardCard
        icon={<FaChartBar className="text-(--color-secondary-500)" />}
        title={t("stats.analyses")}
        value={230}
        color="border-(--ui-border)"
      />
    </div>
  );
}
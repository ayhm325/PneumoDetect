import React from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function UsersChart() {
  const t = useTranslations("adminDashboard");
  const chartTitle = t("usersChart.title");
  return (
    <div className="card-glass p-6 mt-8 border border-(--ui-border)">
      <h3 className="font-bold text-lg mb-4 text-foreground">{chartTitle}</h3>
      <div className="w-full h-32 rounded-xl bg-(--ui-surface-2) border border-(--ui-border)" />
    </div>
  );
}
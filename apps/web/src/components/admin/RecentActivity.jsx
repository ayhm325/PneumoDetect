import React from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function RecentActivity() {
  const t = useTranslations("adminDashboard");
  const title = t("demoActivity.title");
  const activities = [
    {
      id: 1,
      text: t("demoActivity.items.addUser"),
      time: t("demoActivity.times.minuteAgo"),
    },
    {
      id: 2,
      text: t("demoActivity.items.editPatient"),
      time: t("demoActivity.times.minutesAgo5"),
    },
    {
      id: 3,
      text: t("demoActivity.items.deleteDoctor"),
      time: t("demoActivity.times.minutesAgo10"),
    },
  ];
  return (
    <div className="card-glass p-6 border border-(--ui-border) mt-8">
      <h3 className="font-bold text-lg mb-4 text-foreground">{title}</h3>
      <ul className="space-y-3">
        {activities.map((act) => (
          <li key={act.id} className="flex justify-between text-foreground">
            <span>{act.text}</span>
            <span className="text-xs text-(--ui-muted-2)">{act.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
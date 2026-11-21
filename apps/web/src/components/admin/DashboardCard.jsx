import React from "react";
import UnifiedCard from "../ui/UnifiedCard";

export default function DashboardCard({ icon, title, value, color }) {
  return (
    <UnifiedCard className={`rounded-2xl flex flex-col items-center ${color || "border-(--ui-border)"}`} glass>
      <div className="mb-3 text-4xl">{icon}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-(--ui-muted)">{title}</div>
    </UnifiedCard>
  );
}

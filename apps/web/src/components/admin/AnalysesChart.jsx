"use client";

import React from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function AnalysesChart() {
  const t = useTranslations("adminAnalyses");
  const chartTitle = t("chart.title");

  return (
    <div className="card-glass rounded-2xl p-6 border border-(--ui-border) mt-8">
      <h3 className="font-bold text-lg mb-4 text-(--ui-foreground)">
        {chartTitle}
      </h3>
      <div className="w-full h-32 bg-(--ui-surface-2)/60 rounded-xl border border-(--ui-border)" />
    </div>
  );
}

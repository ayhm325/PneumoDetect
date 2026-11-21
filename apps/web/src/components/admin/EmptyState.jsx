"use client";

import React from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function EmptyState({ message }) {
  const t = useTranslations("adminCommon");
  const noDataText = message || t("noData");
  return (
    <div className="text-center text-(--ui-muted-foreground) py-8">
      <p>{noDataText}</p>
    </div>
  );
}
"use client";

import React from "react";
import { FaServer } from "react-icons/fa";
import { useTranslations } from "@/lib/compat/intl";

export default function SystemLoadCard() {
  const t = useTranslations("adminCommon");
  const loadLabel = t("systemLoadLabel");
  return (
    <div className="card-glass p-6 flex flex-col items-center border border-(--ui-border) mt-8">
      <FaServer className="text-4xl text-(--ui-success) mb-3" />
      <div className="text-2xl font-bold mb-1">%65</div>
      <div className="text-(--ui-muted-2)">{loadLabel}</div>
    </div>
  );
}

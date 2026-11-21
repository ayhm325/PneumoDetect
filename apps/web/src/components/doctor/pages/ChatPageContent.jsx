"use client";

import React from "react";
import ChatPanel from "../../../doctor/components/ChatPanel";
import { useTranslations } from "@/lib/compat/intl";

export default function ChatPageContent() {
  const t = useTranslations("doctorChat");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <ChatPanel />
    </div>
  );
}

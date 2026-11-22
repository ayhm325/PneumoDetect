import React from "react";
import { useTranslation } from "react-i18next";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";

export default function PatientChatPage() {
  const { i18n } = useTranslation("patientChat");
  const isAr = i18n.language === "ar";

  return <ChatWorkspace role="patient" isAr={isAr} />;
}

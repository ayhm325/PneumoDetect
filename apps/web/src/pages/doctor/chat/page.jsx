import React from "react";
import { useTranslation } from "react-i18next";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";

export default function DoctorChatPage() {
  const { i18n } = useTranslation("doctorChat");
  const isAr = i18n.language === "ar";

  return <ChatWorkspace role="doctor" isAr={isAr} />;
}

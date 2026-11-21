"use client";

import React from "react";
import { FaComments } from "react-icons/fa";
import { useTranslations } from "@/lib/compat/intl";

export default function RecentChatsClient() {
  const t = useTranslations("adminDashboard");
  const title = t("demoChats.title");
  const chats = [
    {
      id: 1,
      doctor: t("demoChats.items.doctor1"),
      patient: t("demoChats.items.patient1"),
      lastMsg: t("demoChats.items.lastMsg1"),
    },
    {
      id: 2,
      doctor: t("demoChats.items.doctor2"),
      patient: t("demoChats.items.patient2"),
      lastMsg: t("demoChats.items.lastMsg2"),
    },
    {
      id: 3,
      doctor: t("demoChats.items.doctor3"),
      patient: t("demoChats.items.patient3"),
      lastMsg: t("demoChats.items.lastMsg3"),
    },
  ];
  return (
    <div className="card-glass rounded-2xl p-6 border border-(--ui-border) mt-8">
      <h3 className="font-bold text-lg mb-4 text-(--ui-foreground)">{title}</h3>
      <ul className="space-y-3">
        {chats.map((chat) => (
          <li
            key={chat.id}
            className="flex items-center gap-2 text-(--ui-foreground)"
          >
            <FaComments className="text-(--ui-muted-foreground)" />
            <span className="font-bold">{chat.doctor}</span>
            <span className="mx-2 text-(--ui-muted-foreground)">→</span>
            <span className="font-bold">{chat.patient}</span>
            <span className="ml-2 text-xs text-(--ui-muted-foreground)">
              {chat.lastMsg}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
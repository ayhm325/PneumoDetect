"use client";

import React from "react";
import { useTranslations } from "@/lib/compat/intl";
import NotificationBell from "../ui/NotificationBell";

export default function AdminTopbar() {
  const tTopbar = useTranslations("adminTopbar");
  const tNotifications = useTranslations("notifications");

  const title = tTopbar("title");

  const notifications = [
    {
      id: 1,
      title: tTopbar("notifications.newUserTitle"),
      message: tTopbar("notifications.newUserMsg"),
      time: tNotifications("timeMinutesAgo", { mins: 5 }),
      read: false,
    },
    {
      id: 2,
      title: tTopbar("notifications.newTestTitle"),
      message: tTopbar("notifications.newTestMsg"),
      time: tNotifications("timeMinutesAgo", { mins: 15 }),
      read: false,
    },
    {
      id: 3,
      title: tTopbar("notifications.systemAlertTitle"),
      message: tTopbar("notifications.systemAlertMsg"),
      time: tNotifications("timeMinutesAgo", { mins: 30 }),
      read: true,
    },
  ];

  return (
    <header className="w-full h-16 brand-gradient flex items-center justify-between px-6 shadow-(--shadow-soft)">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <NotificationBell notifications={notifications} />
    </header>
  );
}

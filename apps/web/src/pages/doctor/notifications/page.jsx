"use client";

import { useEffect, useState } from "react";
import { FaBell, FaTrash, FaCheck, FaCheckDouble } from "react-icons/fa";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import { useToast } from "@/components/ui/ToastProvider";
import DoctorLayout from "../DoctorLayout";

export default function NotificationsPage() {
  const locale = useLocale();
  const t = useTranslations("notifications");
  const { showSuccess, showInfo } = useToast(); // Updated import path

  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [nowMs, setNowMs] = useState(0);

  const getLocalizedMessage = (raw) => {
    if (raw == null) return "";
    const str = String(raw);
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === "object") {
        const byLocale = parsed?.[locale];
        if (typeof byLocale === "string" && byLocale.trim()) return byLocale;
        const fallback = parsed?.en || parsed?.ar;
        if (typeof fallback === "string") return fallback;
      }
    } catch {}
    return str;
  };

  const getTypeIcon = (type) => {
    const icons = { info: "ℹ️", success: "✅", warning: "⚠️", alert: "🚨" };
    return icons[type] || "🔔";
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      info: "bg-(--ui-info-bg) text-(--ui-foreground) border border-(--ui-info-border)",
      success:
        "bg-(--ui-success-bg) text-(--ui-foreground) border border-(--ui-success-border)",
      warning:
        "bg-(--ui-warning-bg) text-(--ui-foreground) border border-(--ui-warning-border)",
      alert:
        "bg-(--ui-danger)/10 text-(--ui-foreground) border border-(--ui-danger)/20",
    };
    return (
      colors[type] ||
      "bg-(--ui-surface-2)/60 text-(--ui-foreground) border border-(--ui-border)"
    );
  };

  const getTypeLabel = (type) => {
    const typeLabels = {
      info: t("typeInfo"),
      success: t("typeSuccess"),
      warning: t("typeWarning"),
      alert: t("typeAlert"),
    };
    return typeLabels[type] || t("typeInfo");
  };

  const formatRelativeTime = (dateValue) => {
    const dt = dateValue ? new Date(dateValue) : null;
    if (!dt || isNaN(dt.getTime())) return "";
    if (!nowMs) return "";
    const diffMs = Math.max(0, nowMs - dt.getTime());
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return t("timeJustNow");
    if (mins < 60) return t("timeMinutesAgo", { mins });
    const hours = Math.floor(mins / 60);
    if (hours === 1) return t("timeHourAgo");
    if (hours < 24) return t("timeHoursAgo", { hours });
    const days = Math.floor(hours / 24);
    return t("timeDaysAgo", { days });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/doctor/notifications", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        setNowMs(Date.now());
        setNotifications(
          Array.isArray(data?.notifications) ? data.notifications : [],
        );
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.isRead;
    if (filter === "read") return notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalCount = notifications.length;
  const readCount = totalCount - unreadCount;

  const handleDelete = async (id) => {
    const res = await fetch(`/api/doctor/notifications?id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      showInfo(t("errorUpdate"));
      return;
    }
    const data = await res.json();
    if (data.success) {
      setNotifications(notifications.filter((n) => n.id !== id));
      showInfo(t("notificationDeleted"));
    } else {
      showInfo(t("errorUpdate"));
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(t("confirmDeleteAll"))) return;
    const res = await fetch("/api/doctor/notifications", { method: "DELETE" });
    if (!res.ok) {
      showInfo(t("errorUpdate"));
      return;
    }
    const data = await res.json();
    if (data.success) {
      setNotifications([]);
      showInfo(t("notificationDeleted"));
      showSuccess(t("allDeleted"));
    } else {
      showInfo(t("errorUpdate"));
    }
  };

  const handleMarkAsRead = async (id) => {
    const res = await fetch(`/api/doctor/notifications?id=${id}`, {
      method: "PUT",
      body: JSON.stringify({ isRead: true }),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      showInfo(t("errorUpdate"));
      return;
    }
    const data = await res.json();
    if (data.success) {
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      showInfo(t("markedRead"));
    } else {
      showInfo(t("errorUpdate"));
    }
  };

  const handleMarkAsUnread = async (id) => {
    const res = await fetch(`/api/doctor/notifications?id=${id}`, {
      method: "PUT",
      body: JSON.stringify({ isRead: false }),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      showInfo(t("errorUpdate"));
      return;
    }
    const data = await res.json();
    if (data.success) {
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
      showInfo(t("markedUnread"));
    } else {
      showInfo(t("errorUpdate"));
    }
  };

  const handleMarkAllAsRead = async () => {
    const res = await fetch("/api/doctor/notifications", { method: "PUT" });
    if (!res.ok) {
      showInfo(t("errorUpdate"));
      return;
    }
    const data = await res.json();
    if (data.success) {
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      showSuccess(t("allMarkedRead"));
    } else {
      showInfo(t("errorUpdate"));
    }
  };

  return (
    <DoctorLayout
      breadcrumbs={[
        {
          label: t("title"),
          href: `${locale === "en" ? "/en" : "/ar"}/doctor/notifications`,
        },
      ]}
    >
      {/* <ToastContainer /> */}

      <div className="py-8 px-4 md:px-8">
        <div className="max-w-4xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              {/* <ToastContainer /> Removed react-toastify */}
              <p className="text-(--ui-muted-foreground)">
                {unreadCount > 0
                  ? t("unreadCount", { unread: unreadCount, total: totalCount })
                  : t("allRead", { total: totalCount })}
              </p>
            </div>
            <FaBell size={32} className="text-(--ui-info)" />
          </div>

          <div className="flex gap-3 mb-8 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "all"
                  ? "bg-(--ui-info) text-(--ui-info-foreground)"
                  : "bg-(--ui-surface-2)/60 text-(--ui-foreground) border border-(--ui-border) hover:bg-(--ui-surface-2)"
              }`}
            >
              {t("filterAll")} ({totalCount})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "unread"
                  ? "bg-(--ui-info) text-(--ui-info-foreground)"
                  : "bg-(--ui-surface-2)/60 text-(--ui-foreground) border border-(--ui-border) hover:bg-(--ui-surface-2)"
              }`}
            >
              {t("filterUnread")} ({unreadCount})
            </button>
            <button
              onClick={() => setFilter("read")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "read"
                  ? "bg-(--ui-info) text-(--ui-info-foreground)"
                  : "bg-(--ui-surface-2)/60 text-(--ui-foreground) border border-(--ui-border) hover:bg-(--ui-surface-2)"
              }`}
            >
              {t("filterRead")} ({readCount})
            </button>
          </div>

          <div className="flex gap-3 mb-8 flex-wrap">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-(--ui-success) hover:bg-(--ui-success)/90 disabled:opacity-50 text-(--ui-success-foreground) rounded-lg transition"
            >
              <FaCheckDouble size={14} />
              {t("markAllRead")}
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={totalCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-(--ui-danger) hover:bg-(--ui-danger)/90 disabled:opacity-50 text-(--ui-danger-foreground) rounded-lg transition"
            >
              <FaTrash size={14} />
              {t("deleteAll")}
            </button>
          </div>

          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="card-glass border border-(--ui-border) rounded-xl p-12 text-center">
                <FaBell
                  size={48}
                  className="mx-auto mb-4 text-(--ui-muted-foreground)"
                />
                <p className="text-(--ui-muted-foreground) text-lg">
                  {filter === "unread"
                    ? t("noUnread")
                    : filter === "read"
                      ? t("noRead")
                      : t("noNotifications")}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`card-glass border border-(--ui-border) rounded-xl p-5 transition hover:shadow-(--shadow-lift) ${
                    notif.isRead ? "" : "bg-(--ui-info-bg)"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getTypeBadgeColor(notif.type)}`}
                      >
                        {getTypeIcon(notif.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-(--ui-foreground) truncate">
                            {getTypeLabel(notif.type)}
                          </h3>
                          {!notif.isRead && (
                            <span className="text-xs px-2 py-1 rounded-full bg-(--ui-danger) text-(--ui-danger-foreground)">
                              {t("new")}
                            </span>
                          )}
                        </div>
                        <p className="text-(--ui-muted-foreground) text-sm wrap-break-word">
                          {getLocalizedMessage(notif.message)}
                        </p>
                        <p className="text-(--ui-muted-foreground) text-xs mt-2">
                          {formatRelativeTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!notif.isRead ? (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="p-2 rounded-lg bg-(--ui-success) text-(--ui-success-foreground) hover:bg-(--ui-success)/90"
                          title={t("markAsRead")}
                        >
                          <FaCheck size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkAsUnread(notif.id)}
                          className="p-2 rounded-lg bg-(--ui-surface-2) border border-(--ui-border) hover:bg-(--ui-surface-2)/80"
                          title={t("markAsUnread")}
                        >
                          <FaCheck size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="p-2 rounded-lg bg-(--ui-danger) text-(--ui-danger-foreground) hover:bg-(--ui-danger)/90"
                        title={t("deleteNotification")}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
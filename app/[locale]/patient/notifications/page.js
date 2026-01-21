"use client";
import { useState, useEffect } from "react";
import { useToast } from "../../../components/ui/ToastProvider";
import { useTranslations } from "next-intl";
import { FaBell, FaTrash, FaCheck, FaCheckDouble } from "react-icons/fa";
import { useLocale } from "next-intl";

export default function PatientNotificationsPage() {
  const locale = useLocale();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const [filter, setFilter] = useState("all");
  const t = useTranslations("notifications");
  const [nowMs, setNowMs] = useState(0);
  const labels = {
    pageTitle: t("pageTitle"),
    unreadCount: (...args) =>
      t("unreadCount", { unread: args[0], total: args[1] }),
    allRead: (...args) => t("allRead", { total: args[0] }),
    filterAll: t("filterAll"),
    filterUnread: t("filterUnread"),
    filterRead: t("filterRead"),
    markAllRead: t("markAllRead"),
    deleteAll: t("deleteAll"),
    markAsRead: t("markAsRead"),
    markAsUnread: t("markAsUnread"),
    deleteNotification: t("deleteNotification"),
    typeAppointment: t("typeAppointment"),
    typeResult: t("typeResult"),
    typeMessage: t("typeMessage"),
    typeReminder: t("typeReminder"),
    typeSystem: t("typeSystem"),
    noUnread: t("noUnread"),
    noRead: t("noRead"),
    noNotifications: t("noNotifications"),
    statsTotal: t("statsTotal"),
    statsUnread: t("statsUnread"),
    statsRead: t("statsRead"),
    toast: {
      notificationDeleted: t("notificationDeleted"),
      allDeleted: t("allDeleted"),
      markedRead: t("markedRead"),
      allMarkedRead: t("allMarkedRead"),
      markedUnread: t("markedUnread"),
    },
    confirmDeleteAll: t("confirmDeleteAll"),
    timeMinutesAgo: (mins) => t("timeMinutesAgo", { mins }),
    timeHourAgo: () => t("timeHourAgo"),
    timeHoursAgo: (hours) => t("timeHoursAgo", { hours }),
    timeDaysAgo: (days) => t("timeDaysAgo", { days }),
    timeJustNow: () => t("timeJustNow"),
    // ...add all other keys as needed...
  };
  // ...existing code...
  // The following block is misplaced and should be removed or integrated into the i18n system.
  // Removed duplicate Arabic labels object.

  const [notifications, setNotifications] = useState([]);

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/patient/notifications", {
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

  const handleDelete = async (id) => {
    await fetch(`/api/patient/notifications?id=${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showInfo(labels.toast.notificationDeleted);
  };

  const handleDeleteAll = async () => {
    if (window.confirm(labels.confirmDeleteAll)) {
      // حذف من الباك-إند
      await fetch("/api/patient/notifications", { method: "DELETE" });
      setNotifications([]);
      showSuccess(labels.toast.allDeleted);
    }
  };

  const handleMarkAsRead = async (id) => {
    const res = await fetch(`/api/patient/notifications?id=${id}`, {
      method: "PUT",
      body: JSON.stringify({ isRead: true }),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      showError(labels.toast.errorUpdate);
      return;
    }
    const data = await res.json();
    if (data.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      showInfo(labels.toast.markedRead);
    } else {
      showError(labels.toast.errorUpdate);
    }
  };

  const handleMarkAllAsRead = async () => {
    const res = await fetch("/api/patient/notifications", { method: "PUT" });
    if (!res.ok) {
      showError(labels.toast.errorUpdate);
      return;
    }
    const data = await res.json();
    if (data.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showSuccess(labels.toast.allMarkedRead);
    } else {
      showError(labels.toast.errorUpdate);
    }
  };

  const handleMarkAsUnread = async (id) => {
    const res = await fetch(`/api/patient/notifications?id=${id}`, {
      method: "PUT",
      body: JSON.stringify({ isRead: false }),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      showError(labels.toast.errorUpdate);
      return;
    }
    const data = await res.json();
    if (data.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
      showInfo(labels.toast.markedUnread);
    } else {
      showError(labels.toast.errorUpdate);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      alert: "🚨",
    };
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalCount = notifications.length;

  const formatRelativeTime = (dateValue) => {
    const dt = dateValue ? new Date(dateValue) : null;
    if (!dt || isNaN(dt.getTime())) return "";
    if (!nowMs) return "";
    const diffMs = Math.max(0, nowMs - dt.getTime());
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return labels.timeJustNow();
    if (mins < 60) return labels.timeMinutesAgo(mins);
    const hours = Math.floor(mins / 60);
    if (hours === 1) return labels.timeHourAgo();
    if (hours < 24) return labels.timeHoursAgo(hours);
    const days = Math.floor(hours / 24);
    return labels.timeDaysAgo(days);
  };

  return (
    <div className="min-h-screen bg-(--ui-surface) text-(--ui-foreground) py-8 px-4">


      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-(--ui-foreground) mb-2">
              {labels.pageTitle}
            </h1>
            <p className="text-(--ui-muted-foreground)">
              {unreadCount > 0
                ? labels.unreadCount(unreadCount, totalCount)
                : labels.allRead(totalCount)}
            </p>
          </div>
          <FaBell size={32} className="text-(--ui-success)" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "all"
                ? "bg-(--ui-success) text-(--ui-success-foreground)"
                : "bg-(--ui-surface-2)/60 text-(--ui-foreground) border border-(--ui-border) hover:bg-(--ui-surface-2)"
            }`}
          >
            {labels.filterAll} ({totalCount})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "unread"
                ? "bg-(--ui-success) text-(--ui-success-foreground)"
                : "bg-(--ui-surface-2)/60 text-(--ui-foreground) border border-(--ui-border) hover:bg-(--ui-surface-2)"
            }`}
          >
            {labels.filterUnread} ({unreadCount})
          </button>
          <button
            onClick={() => setFilter("read")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "read"
                ? "bg-(--ui-success) text-(--ui-success-foreground)"
                : "bg-(--ui-surface-2)/60 text-(--ui-foreground) border border-(--ui-border) hover:bg-(--ui-surface-2)"
            }`}
          >
            {labels.filterRead} ({notifications.filter((n) => n.isRead).length})
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-(--ui-success) hover:bg-(--ui-success)/90 disabled:opacity-50 text-(--ui-success-foreground) rounded-lg transition"
          >
            <FaCheckDouble size={14} />
            {labels.markAllRead}
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={totalCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-(--ui-danger) hover:bg-(--ui-danger)/90 disabled:opacity-50 text-(--ui-danger-foreground) rounded-lg transition"
          >
            <FaTrash size={14} />
            {labels.deleteAll}
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="card-glass border border-(--ui-border) rounded-xl p-12 text-center">
              <FaBell
                size={48}
                className="mx-auto mb-4 text-(--ui-muted-foreground)"
              />
              <p className="text-(--ui-muted-foreground) text-lg">
                {filter === "unread"
                  ? labels.noUnread
                  : filter === "read"
                    ? labels.noRead
                    : labels.noNotifications}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`card-glass border border-(--ui-border) rounded-xl p-6 border-l-4 transition hover:shadow-lg ${
                  notif.isRead
                    ? "border-l-(--ui-border)"
                    : "border-l-(--ui-success)"
                } ${!notif.isRead ? "bg-(--ui-success-bg)" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-2xl">
                        {getTypeIcon(notif.type)}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(notif.type)}`}
                      >
                        {getTypeLabel(notif.type)}
                      </span>
                      {!notif.isRead && (
                        <div className="w-3 h-3 bg-(--ui-success) rounded-full ml-auto shrink-0"></div>
                      )}
                    </div>
                    <p className="text-(--ui-muted-foreground) mb-2">
                      {getLocalizedMessage(notif.message)}
                    </p>
                    <p className="text-sm text-(--ui-muted-foreground)">
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 shrink-0">
                    {!notif.isRead ? (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        title={labels.markAsRead}
                        className="p-2 text-(--ui-success) hover:bg-(--ui-success-bg) rounded-lg transition"
                      >
                        <FaCheck size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkAsUnread(notif.id)}
                        title={labels.markAsUnread}
                        className="p-2 text-(--ui-muted-foreground) hover:bg-(--ui-surface-2)/60 rounded-lg transition"
                      >
                        <FaCheck size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      title={labels.deleteNotification}
                      className="p-2 text-(--ui-danger) hover:bg-(--ui-danger-bg) rounded-lg transition"
                    >
                      <FaTrash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { ArrowLeftRightIcon, BellIcon, BriefcaseMedicalIcon, CircleCheckIcon, ClockIcon, InfoIcon, ListIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/lib/compat/navigation";
import { useLocale, useTranslations } from "@/lib/compat/intl";

import { formatActivityDescription } from "@/lib/activityFormat";
import { deserializeLocalizedMessage } from "@/lib/notifications";
import { apiRequest } from "@/lib/apiClient";

export default function AdminNotificationsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("adminNotifications");
  const ui = useTranslations("ui");
  const basePrefix = `/${locale}`;
  const placeholder = ui("placeholder");

  const [unreadCount, setUnreadCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [pendingDoctorCount, setPendingDoctorCount] = useState(0);
  const [pendingChangeRequestCount, setPendingChangeRequestCount] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          unreadJson,
          doctorsJson,
          changeReqJson,
          notificationsJson,
          activitiesJson,
        ] = await Promise.all([
          apiRequest("/api/admin/notifications-unread").catch(() => null),
          apiRequest("/api/admin/doctors").catch(() => null),
          apiRequest("/api/admin/doctor-change-requests").catch(() => null),
          apiRequest("/api/admin/notifications").catch(() => null),
          apiRequest("/api/admin/recent-activities").catch(() => null),
        ]);

        if (!mounted) return;

        const unread = Number(unreadJson?.unread || 0);
        const badge = Number(
          (unreadJson && (unreadJson.badge ?? unreadJson.unread)) || 0,
        );
        setUnreadCount(unread);
        setBadgeCount(badge);

        const pendingDocs = Array.isArray(doctorsJson?.doctors)
          ? doctorsJson.doctors.filter((d) => d?.status === "pending")
          : [];
        setPendingDoctorCount(pendingDocs.length);

        const pendingReqs = Array.isArray(changeReqJson?.requests)
          ? changeReqJson.requests
          : [];
        setPendingChangeRequestCount(pendingReqs.length);

        setNotifications(
          Array.isArray(notificationsJson?.notifications)
            ? notificationsJson.notifications
            : [],
        );
        setActivities(
          Array.isArray(activitiesJson?.activities)
            ? activitiesJson.activities
            : [],
        );

        // If there are unread notifications, mark them read on page enter
        try {
          const hasUnread =
            Array.isArray(notificationsJson?.notifications) &&
            notificationsJson.notifications.some((n) => !n.isRead);
          if (hasUnread) {
            apiRequest("/api/admin/notifications", { method: "PATCH" }).catch(
              () => {},
            );
            // update local state to mark as read
            if (mounted)
              setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true })),
              );
            setUnreadCount(0);
            setBadgeCount(0);
          }
        } catch (e) {}

        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        setError(t("errors.loadFailed"));
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [t]);

  const summaryCards = useMemo(
    () => [
      {
        title: t("summary.unread"),
        value: unreadCount,
        icon: BellIcon,
        accent: "brand-gradient",
        onClick: null,
      },
      {
        title: t("summary.pendingDoctorApprovals"),
        value: pendingDoctorCount,
        icon: BriefcaseMedicalIcon,
        accent: "brand-gradient",
        onClick: () => router.push(`${basePrefix}/admin/doctors`),
      },
      {
        title: t("summary.pendingDoctorChangeRequests"),
        value: pendingChangeRequestCount,
        icon: ArrowLeftRightIcon,
        accent: "brand-gradient",
        onClick: () =>
          router.push(`${basePrefix}/admin/doctor-change-requests-page`),
      },
    ],
    [
      t,
      unreadCount,
      pendingDoctorCount,
      pendingChangeRequestCount,
      router,
      basePrefix,
    ],
  );

  const typeBadge = (type) => {
    switch (type) {
      case "success":
        return {
          icon: CircleCheckIcon,
          className:
            "bg-(--ui-success-bg) text-(--ui-success) border-(--ui-success-border)",
        };
      case "warning":
        return {
          icon: TriangleAlertIcon,
          className:
            "bg-(--ui-warning-bg) text-(--ui-warning) border-(--ui-warning-border)",
        };
      case "alert":
        return {
          icon: TriangleAlertIcon,
          className:
            "bg-(--ui-danger-bg) text-(--ui-danger) border-(--ui-danger-border)",
        };
      case "info":
      default:
        return {
          icon: InfoIcon,
          className:
            "bg-(--ui-info-bg) text-(--ui-info) border-(--ui-info-border)",
        };
    }
  };

  const formatDateTime = (value) => {
    if (!value) return placeholder;
    try {
      const d = new Date(value);
      return d.toLocaleString(locale === "en" ? "en-US" : "ar-EG");
    } catch {
      return placeholder;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="text-(--ui-muted-2) mt-2">{t("subtitle")}</p>
        </div>

        <div className="relative p-3 pd-panel pd-shape-asymmetric rounded-full border border-(--ui-border) shadow-(--shadow-soft)">
          <BellIcon className="text-xl text-(--ui-muted-2)" />
          {badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-(--ui-danger) text-[var(--pd-on-accent)] text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {badgeCount}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-(--ui-danger-border) bg-(--color-neutral)/80 p-4 text-(--ui-danger)">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
        {summaryCards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={card.onClick || undefined}
            disabled={!card.onClick}
            className="pd-panel pd-shape-layered shadow-(--shadow-soft) p-6 border border-(--ui-border) hover:shadow-(--shadow-lift) transition-shadow w-full text-start disabled:cursor-default"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-lg ${card.accent} shadow-(--shadow-soft)`}
              >
                <card.icon className="text-2xl text-[var(--pd-on-accent)]" />
              </div>
              <ListIcon className="text-(--ui-muted-2)" />
            </div>
            <h3 className="text-(--ui-muted-2) text-sm font-medium mb-2">
              {card.title}
            </h3>
            <p className="text-3xl font-bold text-foreground">
              {loading ? "â€¦" : card.value}
            </p>
            {card.onClick && (
              <p className="mt-2 text-sm text-(--ui-muted-2)">
                {t("summary.clickToOpen")}
              </p>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="pd-panel pd-shape-organic shadow-(--shadow-soft) p-6 border border-(--ui-border)">
          <h2 className="text-xl font-bold text-foreground mb-4">
            {t("sections.notifications")}
          </h2>

          {loading ? (
            <div className="rounded-xl border border-(--ui-border) bg-(--ui-surface) p-6 text-(--ui-muted-2)">
              {t("states.loading")}
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-xl border border-(--ui-border) bg-(--ui-surface) p-6 text-(--ui-muted-2)">
              {t("states.emptyNotifications")}
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const badge = typeBadge(n.type);
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={n.id}
                    className={`rounded-xl border border-(--ui-border) bg-(--ui-surface) p-4 ${
                      n.isRead ? "opacity-70" : "opacity-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold border ${badge.className}`}
                          >
                            <BadgeIcon />
                            {t(`types.${n.type}`)}
                          </span>
                          {!n.isRead && (
                            <span className="text-xs font-semibold text-(--ui-danger)">
                              {t("states.unread")}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground wrap-break-word">
                          {deserializeLocalizedMessage(n.message, locale)}
                        </p>
                      </div>

                      <div className="shrink-0 text-xs text-(--ui-muted-2) flex items-center gap-2">
                        <ClockIcon />
                        <span>{formatDateTime(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pd-panel pd-shape-asymmetric shadow-(--shadow-soft) p-6 border border-(--ui-border)">
          <h2 className="text-xl font-bold text-foreground mb-4">
            {t("sections.recentActivity")}
          </h2>

          {loading ? (
            <div className="rounded-xl border border-(--ui-border) bg-(--ui-surface) p-6 text-(--ui-muted-2)">
              {t("states.loading")}
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-xl border border-(--ui-border) bg-(--ui-surface) p-6 text-(--ui-muted-2)">
              {t("states.emptyActivity")}
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-(--ui-border) bg-(--ui-surface) p-4"
                >
                  <p className="text-foreground">
                    {formatActivityDescription(a, locale) || placeholder}
                  </p>
                  <p className="mt-2 text-xs text-(--ui-muted-2) flex items-center gap-2">
                    <ClockIcon />
                    <span>{formatDateTime(a.createdAt)}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
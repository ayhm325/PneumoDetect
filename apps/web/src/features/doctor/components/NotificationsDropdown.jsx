import React from "react";
import NotificationItem from "./NotificationItem";
import styles from "./NotificationsDropdown.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function NotificationsDropdown({
  notifications = [],
  onMarkAsRead,
}) {
  const t = useTranslations("doctorTopbar");
  return (
    <div className={styles.dropdown}>
      <h3>{t("notificationsTitle")}</h3>
      <ul>
        {notifications.length === 0 ? (
          <li className={styles.empty}>{t("noNewNotifications")}</li>
        ) : (
          notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkAsRead={onMarkAsRead}
            />
          ))
        )}
      </ul>
    </div>
  );
}

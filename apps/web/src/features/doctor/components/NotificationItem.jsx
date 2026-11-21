import React from "react";
import MarkAsReadButton from "./MarkAsReadButton";
import styles from "./NotificationItem.module.css";

export default function NotificationItem({ notification, onMarkAsRead }) {
  return (
    <li
      className={styles.item + (notification.urgent ? " " + styles.urgent : "")}
    >
      <div className={styles.content}>
        <span className={styles.type}>{notification.type}</span>
        <span className={styles.text}>{notification.text}</span>
        <span className={styles.time}>{notification.time}</span>
      </div>
      {!notification.read && (
        <MarkAsReadButton onClick={() => onMarkAsRead(notification.id)} />
      )}
    </li>
  );
}

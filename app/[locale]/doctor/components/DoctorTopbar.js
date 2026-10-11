"use client";
import Image from "next/image";
import React, { useState } from "react";
import { FaBell, FaCog, FaSignOutAlt } from "react-icons/fa";
import NotificationsDropdown from "./NotificationsDropdown";
import styles from "./DoctorTopbar.module.css";
import { useTranslations } from "next-intl";

export default function DoctorTopbar({ doctorName, profileImage, onLogout }) {
  const t = useTranslations("doctorTopbar");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: t("mockNotifications.0.type"),
      text: t("mockNotifications.0.text"),
      time: "10:05",
      urgent: false,
      read: false,
    },
    {
      id: 2,
      type: t("mockNotifications.1.type"),
      text: t("mockNotifications.1.text"),
      time: "09:50",
      urgent: true,
      read: false,
    },
    {
      id: 3,
      type: t("mockNotifications.2.type"),
      text: t("mockNotifications.2.text"),
      time: "09:30",
      urgent: true,
      read: false,
    },
  ]);

  const handleMarkAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.profileSection}>
        <Image
          src={profileImage}
          alt={t("doctorImageAlt")}
          width={48}
          height={48}
          className={styles.profileImage}
          sizes="48px"
        />
        <span className={styles.doctorName}>{doctorName}</span>
      </div>
      <div className={styles.actions}>
        <div className={styles.notificationsWrap}>
          <button
            className={styles.iconBtn}
            title={t("notificationsTitle")}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <FaBell />
            <span className={styles.badge}>
              {notifications.filter((n) => !n.read).length}
            </span>
          </button>
          {dropdownOpen && (
            <NotificationsDropdown
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
        </div>
        <button className={styles.iconBtn} title={t("settingsTitle")}>
          <FaCog />
        </button>
        <button
          className={styles.iconBtn}
          title={t("logoutTitle")}
          onClick={onLogout}
        >
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
}

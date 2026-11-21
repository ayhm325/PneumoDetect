"use client";

import React from "react";
import {
  FaHome,
  FaUserInjured,
  FaXRay,
  FaComments,
  FaCalendarAlt,
  FaChartBar,
  FaBell,
  FaUserAlt,
} from "react-icons/fa";
import Link from "@/lib/compat/Link";
import { usePathname } from "@/lib/compat/navigation";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import styles from "./DoctorSidebar.module.css";

export default function DoctorSidebar({ active }) {
  const pathname = usePathname();
  const localeValue = useLocale();
  const locale = localeValue || (pathname?.startsWith("/en") ? "en" : "ar");
  const basePrefix = locale === "en" ? "/en" : "/ar";

  const t = useTranslations("doctorSidebar");
  const navItems = [
    {
      label: t("dashboard"),
      icon: <FaHome />,
      href: `${basePrefix}/doctor/dashboard`,
    },
    {
      label: t("patients"),
      icon: <FaUserInjured />,
      href: `${basePrefix}/doctor/patients`,
    },
    {
      label: t("results"),
      icon: <FaXRay />,
      href: `${basePrefix}/doctor/results`,
    },
    {
      label: t("chat"),
      icon: <FaComments />,
      href: `${basePrefix}/doctor/chat`,
    },
    {
      label: t("appointments"),
      icon: <FaCalendarAlt />,
      href: `${basePrefix}/doctor/appointments`,
    },
    {
      label: t("analytics"),
      icon: <FaChartBar />,
      href: `${basePrefix}/doctor/analytics`,
    },
    {
      label: t("notifications"),
      icon: <FaBell />,
      href: `${basePrefix}/doctor/notifications`,
    },
    {
      label: t("settings"),
      icon: <FaUserAlt className={styles.profileIcon} />,
      href: `${basePrefix}/doctor/settings`,
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li
              key={item.label}
              className={active === item.href ? styles.active : ""}
            >
              <Link href={item.href}>
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
import React from "react";
import styles from "./AnalyticsCard.module.css";

export default function AnalyticsCard({ title, value, icon }) {
  return (
    <div className={`${styles.card} ${styles.accent}`}>
      <div className={styles.icon}>
        {icon}
      </div>
      <div className={styles.title}>{title}</div>
      <div className={styles.value}>{value}</div>
    </div>
  );
}

import React from "react";
import styles from "./AnalyticsSummary.module.css";

export default function AnalyticsSummary({ stats }) {
  return (
    <div className={styles.summary}>
      {stats.map((stat, idx) => (
        <div key={idx} className={styles.statBox}>
          <div className={styles.label}>{stat.label}</div>
          <div className={styles.value}>{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

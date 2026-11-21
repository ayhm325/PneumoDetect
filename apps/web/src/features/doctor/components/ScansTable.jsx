"use client";

import React from "react";
import ScanCard from "./ScanCard";
import styles from "./ScansTable.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function ScansTable({ scans, onView, onCompare, onAnnotate }) {
  const t = useTranslations("doctorResults");

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>{t("table.scanNumber")}</th>
          <th>{t("table.date")}</th>
          <th>{t("table.scanType")}</th>
          <th>{t("table.aiSummary")}</th>
          <th>{t("table.comparison")}</th>
          <th>{t("table.actions")}</th>
        </tr>
      </thead>
      <tbody>
        {scans.map((scan) => (
          <tr key={scan.id}>
            <td>
              <ScanCard scan={scan} />
            </td>
            <td>{scan.date}</td>
            <td>{scan.type}</td>
            <td>{scan.aiSummary}</td>
            <td>{scan.comparisonAvailable ? t("table.yes") : t("table.no")}</td>
            <td>
              <button onClick={() => onView(scan)}>
                {t("table.buttons.view")}
              </button>
              <button onClick={() => onCompare(scan)}>
                {t("table.buttons.compare")}
              </button>
              <button onClick={() => onAnnotate(scan)}>
                {t("table.buttons.annotate")}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
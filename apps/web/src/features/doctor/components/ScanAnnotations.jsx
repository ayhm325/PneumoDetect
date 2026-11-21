import React from "react";
import styles from "./ScanAnnotations.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function ScanAnnotations({ annotations }) {
  const t = useTranslations("doctorResults");

  if (!annotations || annotations.length === 0) return null;
  return (
    <div className={styles.annotations}>
      <h3>{t("scanAnnotations.title")}</h3>
      <ul>
        {annotations.map((ann, idx) => (
          <li key={idx}>
            {ann.text} <span className={styles.position}>({ann.position})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

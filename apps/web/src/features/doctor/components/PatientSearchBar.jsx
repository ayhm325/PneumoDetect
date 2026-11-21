import React from "react";
import styles from "./PatientSearchBar.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function PatientSearchBar({ value, onChange }) {
  const t = useTranslations("doctorPatients");
  return (
    <input
      className={styles.searchBar}
      type="text"
      placeholder={t("searchPlaceholder")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
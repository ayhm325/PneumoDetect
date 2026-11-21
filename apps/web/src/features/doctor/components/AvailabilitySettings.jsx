import React from "react";
import styles from "./AvailabilitySettings.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function AvailabilitySettings({ value, onChange }) {
  const t = useTranslations("doctorSettings");

  return (
    <div className={styles.availability}>
      <h3>{t("availability.header")}</h3>
      <label>
        {t("availability.workDays")}:
        <input
          type="text"
          value={value.days || ""}
          onChange={(e) => onChange({ ...value, days: e.target.value })}
          placeholder={t("availability.exampleDays")}
        />
      </label>
      <label>
        {t("availability.startTime")}:
        <input
          type="time"
          value={value.start || ""}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
        />
      </label>
      <label>
        {t("availability.endTime")}:
        <input
          type="time"
          value={value.end || ""}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
        />
      </label>
    </div>
  );
}
import React from "react";
import styles from "./AppointmentFilters.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function AppointmentFilters({ filters, onChange }) {
  const t = useTranslations("doctorAppointments");
  return (
    <div className={styles.filters}>
      <input
        type="text"
        placeholder={t("calendar.filters.patientPlaceholder")}
        value={filters.patient || ""}
        onChange={(e) => onChange({ ...filters, patient: e.target.value })}
      />
      <select
        value={filters.status || ""}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
      >
        <option value="">{t("calendar.filters.allStatuses")}</option>
        <option value="scheduled">
          {t("calendar.statusLabels.scheduled")}
        </option>
        <option value="confirmed">
          {t("calendar.statusLabels.confirmed")}
        </option>
        <option value="cancelled">
          {t("calendar.statusLabels.cancelled")}
        </option>
      </select>
    </div>
  );
}
import React from "react";
import styles from "./AppointmentCard.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function AppointmentCard({ appointment, onEdit }) {
  const t = useTranslations("doctorAppointments");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  const normalizeStatus = (value) => {
    if (!value) return null;
    if (value === "scheduled" || value === "confirmed" || value === "cancelled")
      return value;
    if (value === t("calendar.statusLabels.scheduled")) return "scheduled";
    if (value === t("calendar.statusLabels.confirmed")) return "confirmed";
    if (value === t("calendar.statusLabels.cancelled")) return "cancelled";
    return null;
  };

  const statusKey = normalizeStatus(appointment?.status);
  const statusLabel =
    statusKey === "scheduled"
      ? t("calendar.statusLabels.scheduled")
      : statusKey === "confirmed"
        ? t("calendar.statusLabels.confirmed")
        : statusKey === "cancelled"
          ? t("calendar.statusLabels.cancelled")
          : appointment?.status || placeholder;
  return (
    <div className={styles.card}>
      <div className={styles.info}>
        <div>
          {t("calendar.card.patient")}: {appointment.patient}
        </div>
        <div>
          {t("calendar.card.time")}: {appointment.time}
        </div>
        <div>
          {t("calendar.card.status")}: {statusLabel}
        </div>
      </div>
      <button className={styles.editBtn} onClick={onEdit}>
        {t("calendar.actions.edit")}
      </button>
    </div>
  );
}

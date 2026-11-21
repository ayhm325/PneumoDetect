import React, { useState } from "react";
import styles from "./AddAppointmentModal.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function AddAppointmentModal({
  open,
  appointment,
  onClose,
  onSave,
}) {
  const t = useTranslations("doctorAppointments");
  const normalizeStatus = (value) => {
    if (!value) return "scheduled";
    if (value === "scheduled" || value === "confirmed" || value === "cancelled")
      return value;
    if (value === t("calendar.statusLabels.scheduled")) return "scheduled";
    if (value === t("calendar.statusLabels.confirmed")) return "confirmed";
    if (value === t("calendar.statusLabels.cancelled")) return "cancelled";
    return "scheduled";
  };

  const [form, setForm] = useState(
    appointment
      ? { ...appointment, status: normalizeStatus(appointment.status) }
      : { patient: "", date: "", time: "", status: "scheduled" },
  );

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>
          {appointment
            ? t("calendar.modal.editTitle")
            : t("calendar.modal.addTitle")}
        </h2>
        <form onSubmit={handleSubmit}>
          <label>
            {t("calendar.form.patient")}:
            <input
              name="patient"
              value={form.patient}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            {t("calendar.form.date")}:
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            {t("calendar.form.time")}:
            <input
              name="time"
              type="time"
              value={form.time}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            {t("calendar.form.status")}:
            <select name="status" value={form.status} onChange={handleChange}>
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
          </label>
          <div className={styles.actions}>
            <button type="submit">{t("calendar.actions.save")}</button>
            <button type="button" onClick={onClose}>
              {t("calendar.actions.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

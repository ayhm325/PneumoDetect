import React, { useState } from "react";
import AppointmentCard from "./AppointmentCard";
import AddAppointmentModal from "./AddAppointmentModal";
import AppointmentFilters from "./AppointmentFilters";
import styles from "./AppointmentsCalendar.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function AppointmentsCalendar({
  appointments,
  onAdd,
  onEdit,
  filters,
  onFilterChange,
}) {
  const t = useTranslations("doctorAppointments");
  const daysRaw = t.raw("calendar.days");
  const days = Array.isArray(daysRaw)
    ? daysRaw
    : [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = !filters.status || a.status === filters.status;
    const matchesPatient =
      !filters.patient || a.patient.includes(filters.patient);
    return matchesStatus && matchesPatient;
  });

  const today = new Date();
  const weekAppointments = filteredAppointments.filter((a) => {
    const date = new Date(a.date);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return date >= weekStart && date <= weekEnd;
  });

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <h2>{t("calendar.title")}</h2>
        <button
          onClick={() => {
            setSelectedAppointment(null);
            setModalOpen(true);
          }}
        >
          {t("calendar.addAppointment")}
        </button>
      </div>
      <AppointmentFilters filters={filters} onChange={onFilterChange} />
      <div className={styles.weekView}>
        {days.map((day, idx) => (
          <div key={day} className={styles.dayColumn}>
            <div className={styles.dayHeader}>{day}</div>
            {weekAppointments
              .filter((a) => new Date(a.date).getDay() === idx)
              .map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  onEdit={() => {
                    setSelectedAppointment(a);
                    setModalOpen(true);
                  }}
                />
              ))}
          </div>
        ))}
      </div>
      <AddAppointmentModal
        open={modalOpen}
        appointment={selectedAppointment}
        onClose={() => setModalOpen(false)}
        onSave={selectedAppointment ? onEdit : onAdd}
      />
    </div>
  );
}
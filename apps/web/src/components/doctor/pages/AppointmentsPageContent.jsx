"use client";

import React, { useState } from "react";
import AppointmentsCalendar from "../../../[locale]/doctor/components/AppointmentsCalendar";
import { useTranslations } from "@/lib/compat/intl";

export default function AppointmentsPageContent() {
  const t = useTranslations("doctorAppointments");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  const rawDemoAppointments = t.raw("demoAppointments");
  const demoAppointments = Array.isArray(rawDemoAppointments)
    ? rawDemoAppointments
    : [];

  const normalizeStatus = (value) => {
    if (
      value === "scheduled" ||
      value === "confirmed" ||
      value === "cancelled"
    ) {
      return value;
    }
    return "scheduled";
  };

  const [appointments, setAppointments] = useState(() =>
    demoAppointments.map((item, index) => {
      const patient =
        typeof item?.patient === "string" && item.patient.trim().length > 0
          ? item.patient
          : placeholder;

      const date =
        typeof item?.date === "string" && item.date.trim().length > 0
          ? item.date
          : placeholder;

      const time =
        typeof item?.time === "string" && item.time.trim().length > 0
          ? item.time
          : placeholder;

      const id = typeof item?.id === "number" ? item.id : index + 1;
      const status = normalizeStatus(item?.status);

      return { id, patient, date, time, status };
    }),
  );
  const [filters, setFilters] = useState({});

  const handleAdd = (newAppointment) => {
    setAppointments([
      ...appointments,
      { ...newAppointment, id: appointments.length + 1 },
    ]);
  };
  const handleEdit = (updatedAppointment) => {
    setAppointments(
      appointments.map((a) =>
        a.id === updatedAppointment.id ? updatedAppointment : a,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <AppointmentsCalendar
        appointments={appointments}
        onAdd={handleAdd}
        onEdit={handleEdit}
        filters={filters}
        onFilterChange={setFilters}
      />
    </div>
  );
}
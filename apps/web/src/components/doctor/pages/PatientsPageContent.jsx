"use client";
import React, { useState } from "react";
import PatientsTable from "../../../doctor/components/PatientsTable";
import PatientQuickViewModal from "../../../doctor/components/PatientQuickViewModal";
import PatientFilters from "../PatientFilters";
import PatientSearchBar from "../../../doctor/components/PatientSearchBar";
import Pagination from "../Pagination";
import { useTranslations } from "@/lib/compat/intl";

function normalizePatientStatusCode(statusLabel, t) {
  if (!statusLabel) return null;
  const stable = t("statuses.stable");
  const critical = t("statuses.critical");
  const recovering = t("statuses.recovering");
  const pendingScan = t("filtersForm.statuses.pendingScan");

  if (statusLabel === stable) return "stable";
  if (statusLabel === critical) return "critical";
  if (statusLabel === recovering) return "recovering";
  if (statusLabel === pendingScan) return "pendingScan";

  return null;
}

export default function PatientsPageContent() {
  const t = useTranslations("doctorPatients");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const demoItems = t.raw("items");
  const patients = Array.isArray(demoItems)
    ? demoItems.map((item, index) => {
        const statusLabel = item?.status || placeholder;
        const statusCode = normalizePatientStatusCode(item?.status, t);

        return {
          id: index + 1,
          name: item?.name || placeholder,
          age: item?.age || placeholder,
          status: statusLabel,
          statusCode,
          lastScanDate: item?.lastVisit || placeholder,
          profileImage: "/default-patient.png",
          medicalHistory: item?.conditions || placeholder,
        };
      })
    : [];

  const filteredPatients = patients.filter((p) => {
    const patientName = String(p?.name || "");
    const patientAge = Number(p?.age);

    const matchesSearch = patientName.includes(search);
    const matchesName = !filters.name || patientName.includes(filters.name);
    const matchesAge = !filters.age || patientAge === Number(filters.age);
    const matchesStatus = !filters.status || p.statusCode === filters.status;
    return matchesSearch && matchesName && matchesAge && matchesStatus;
  });

  const pageSize = 10;
  const totalPages = Math.ceil(filteredPatients.length / pageSize);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleView = (patient) => {
    setSelectedPatient(patient);
    setQuickViewOpen(true);
  };
  const handleCloseQuickView = () => {
    setQuickViewOpen(false);
    setSelectedPatient(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <div className="flex gap-2 items-center">
        <PatientSearchBar value={search} onChange={setSearch} />
        <PatientFilters filters={filters} onChange={setFilters} />
      </div>
      <PatientsTable
        patients={paginatedPatients}
        onView={handleView}
        onChat={() => {}}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      <PatientQuickViewModal
        patient={selectedPatient}
        open={quickViewOpen}
        onClose={handleCloseQuickView}
      />
    </div>
  );
}

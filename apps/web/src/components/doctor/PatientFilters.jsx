"use client";

import React from "react";
import styles from "./PatientFilters.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function PatientFilters({ filters, onChange }) {
  const t = useTranslations("doctorPatients");

  return (
    <div className={styles.filters}>
      <input
        type="text"
        placeholder={t("filtersForm.namePlaceholder")}
        value={filters.name || ""}
        onChange={(e) => onChange({ ...filters, name: e.target.value })}
      />
      <input
        type="number"
        placeholder={t("filtersForm.agePlaceholder")}
        value={filters.age || ""}
        onChange={(e) => onChange({ ...filters, age: e.target.value })}
      />
      <select
        value={filters.status || ""}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
      >
        <option value="">{t("filtersForm.statusAll")}</option>
        <option value="stable">{t("filtersForm.statuses.stable")}</option>
        <option value="critical">{t("filtersForm.statuses.critical")}</option>
        <option value="pendingScan">
          {t("filtersForm.statuses.pendingScan")}
        </option>
      </select>
    </div>
  );
}
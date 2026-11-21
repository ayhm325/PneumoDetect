import React from "react";
import PatientCard from "./PatientCard";
import styles from "./PatientsTable.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function PatientsTable({ patients, onView, onChat }) {
  const t = useTranslations("doctorPatients");

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>{t("table.headers.name")}</th>
          <th>{t("table.headers.lastScan")}</th>
          <th>{t("table.headers.status")}</th>
          <th>{t("table.headers.actions")}</th>
        </tr>
      </thead>
      <tbody>
        {patients.map((patient) => (
          <tr key={patient.id}>
            <td>
              <PatientCard patient={patient} />
            </td>
            <td>{patient.lastScanDate}</td>
            <td>{patient.status}</td>
            <td>
              <button
                className={styles.actionButton}
                onClick={() => onView(patient)}
              >
                {t("actions.view")}
              </button>
              <button
                className={styles.actionButton}
                onClick={() => onChat(patient)}
              >
                {t("actions.chat")}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

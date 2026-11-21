import Image from "@/lib/compat/Image";
import React from "react";
import styles from "./PatientQuickViewModal.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function PatientQuickViewModal({ patient, open, onClose }) {
  const t = useTranslations("doctorPatients");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  if (!open || !patient) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>{t("quickView.title")}</h2>
        <Image
          src={patient.profileImage}
          alt={patient.name || placeholder}
          width={64}
          height={64}
          className={styles.avatar}
          sizes="64px"
        />
        <div>
          {t("quickView.labels.name")}: {patient.name || placeholder}
        </div>
        <div>
          {t("quickView.labels.age")}: {patient.age || placeholder}
        </div>
        <div>
          {t("quickView.labels.status")}: {patient.status || placeholder}
        </div>
        <div>
          {t("quickView.labels.lastScan")}:{" "}
          {patient.lastScanDate || placeholder}
        </div>
        <div>
          {t("quickView.labels.medicalHistory")}:{" "}
          {patient.medicalHistory || placeholder}
        </div>
        <button onClick={onClose}>{t("quickView.close")}</button>
      </div>
    </div>
  );
}

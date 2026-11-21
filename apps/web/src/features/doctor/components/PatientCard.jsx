import React from "react";
import Image from "@/lib/compat/Image";
import styles from "./PatientCard.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function PatientCard({ patient }) {
  const t = useTranslations("doctorPatients");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  return (
    <div className={styles.card}>
      <Image
        src={patient.profileImage}
        alt={patient.name || placeholder}
        width={64}
        height={64}
        className={styles.profileImage}
      />
      <div>
        <div className={styles.name}>{patient.name || placeholder}</div>
        <div className={styles.age}>
          {t("quickView.labels.age")}: {patient.age || placeholder}
        </div>
      </div>
    </div>
  );
}

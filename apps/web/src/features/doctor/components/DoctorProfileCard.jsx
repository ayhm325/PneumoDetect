import React from "react";
import Image from "@/lib/compat/Image";
import { FaUserMd, FaEnvelope, FaPhone, FaCheckCircle } from "react-icons/fa";
import styles from "./DoctorProfileCard.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function DoctorProfileCard({ doctor, onEdit }) {
  const t = useTranslations("doctorProfile");
  const onlineLabel = t("status.online");
  const offlineLabel = t("status.offline");
  const statusText = doctor.status || offlineLabel;
  const isOnline = statusText === onlineLabel;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Image
          src={doctor.profileImage}
          alt={t("imageAlt")}
          width={80}
          height={80}
          className={styles.profileImage}
        />
        <div>
          <h2 className={styles.name}>{doctor.name}</h2>
          <span className={styles.specialization}>
            <FaUserMd /> {doctor.specialization}
          </span>
          <span className={isOnline ? styles.online : styles.offline}>
            <FaCheckCircle /> {statusText}
          </span>
        </div>
      </div>
      <div className={styles.info}>
        <div>
          <FaEnvelope /> {doctor.email}
        </div>
        <div>
          <FaPhone /> {doctor.phone}
        </div>
      </div>
      <button className={styles.editBtn} onClick={onEdit}>
        {t("actions.edit")}
      </button>
    </div>
  );
}
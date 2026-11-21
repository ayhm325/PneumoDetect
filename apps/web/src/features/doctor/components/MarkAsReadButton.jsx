import React from "react";
import styles from "./MarkAsReadButton.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function MarkAsReadButton({ onClick }) {
  const t = useTranslations("doctorTopbar");
  return (
    <button className={styles.markReadBtn} onClick={onClick}>
      {t("markAsRead")}
    </button>
  );
}

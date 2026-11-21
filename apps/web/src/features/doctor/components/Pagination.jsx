import React from "react";
import styles from "./Pagination.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const t = useTranslations("doctorCommon");
  if (totalPages <= 1) return null;
  return (
    <div className={styles.pagination}>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        {t("pagination.previous")}
      </button>
      <span>{t("pagination.pageXofY", { currentPage, totalPages })}</span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        {t("pagination.next")}
      </button>
    </div>
  );
}

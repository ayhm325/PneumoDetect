"use client";

import React from "react";
import styles from "./Pagination.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const ui = useTranslations("ui");

  if (totalPages <= 1) return null;
  return (
    <div className={styles.pagination}>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        {ui("pagination.previous")}
      </button>
      <span>
        {ui("pagination.page")} {currentPage} {ui("pagination.of")} {totalPages}
      </span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        {ui("pagination.next")}
      </button>
    </div>
  );
}

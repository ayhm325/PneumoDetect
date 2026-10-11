"use client";

import React from "react";
import styles from "./ChatAttachments.module.css";
import { useTranslations } from "next-intl";

export default function ChatAttachments({ attachments, onAttach }) {
  const t = useTranslations("doctorChat");

  const handleFileChange = (e) => {
    onAttach(Array.from(e.target.files));
  };

  return (
    <div className={styles.attachments}>
      <label className={styles.uploadLabel}>
        {t("actions.attachment")}
        <input type="file" multiple onChange={handleFileChange} className="hidden" />
      </label>
      <div className={styles.filesList}>
        {attachments.map((file, idx) => (
          <span key={idx} className={styles.fileItem}>
            {file.name || t("attachmentFallbackName")}
          </span>
        ))}
      </div>
    </div>
  );
}

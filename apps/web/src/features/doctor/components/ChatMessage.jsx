import React from "react";
import styles from "./ChatMessage.module.css";
import { useTranslations } from "@/lib/compat/intl";

function isImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    // quick check for common image extensions or local upload paths
    const imageExt = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i;
    if (imageExt.test(url)) return true;
    if (url.startsWith("/uploads") || url.includes("s3.amazonaws.com"))
      return true;
    if (url.startsWith("http") && url.includes("/uploads/")) return true;
  } catch (e) {
    return false;
  }
  return false;
}

export default function ChatMessage({ message, patient }) {
  const t = useTranslations("doctorChat");

  const isDoctor = message.sender === "doctor";
  const fileUrl = message.fileUrl || message.file?.url || null;
  const mime = message.mimeType || message.file?.type || null;
  const maybeImage =
    (fileUrl && mime && mime.startsWith("image/")) ||
    isImageUrl(message.text) ||
    (fileUrl && /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(fileUrl));

  const imageUrl = fileUrl || (maybeImage && message.text);

  return (
    <div className={`${styles.message} ${isDoctor ? styles.doctor : ""}`}>
      {!isDoctor && patient?.profileImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={patient.profileImage}
          alt={patient?.name || t("patientFallbackName")}
          width={28}
          height={28}
          className={styles.avatar}
        />
      ) : null}

      <div className={styles.bubble}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={t("imageAlt")} className={styles.image} />
        ) : (
          <span>{message.text}</span>
        )}
        <div className={styles.time}>{message.time}</div>
      </div>
    </div>
  );
}
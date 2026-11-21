import React from "react";
import Image from "@/lib/compat/Image";
import styles from "./ScanCard.module.css";

export default function ScanCard({ scan }) {
  return (
    <div className={styles.card}>
      <Image
        src={scan.thumbnail}
        alt={scan.type}
        width={120}
        height={120}
        className={styles.thumbnail}
      />
      <div>
        <div className={styles.type}>{scan.type}</div>
        <div className={styles.date}>{scan.date}</div>
      </div>
    </div>
  );
}

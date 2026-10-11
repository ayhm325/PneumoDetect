"use client";

import React, { useState } from "react";
import Image from "next/image";
import ScanThumbnails from "./ScanThumbnails";
import ScanAnnotations from "./ScanAnnotations";
import styles from "./ScanViewer.module.css";
import { useTranslations } from "next-intl";

export default function ScanViewer({ scan, images, annotations, onClose }) {
  const t = useTranslations("doctorResults");
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [zoom, setZoom] = useState(1);
  const zoomLevelClass = styles[`zoom${Math.round(zoom * 10)}`] || "";

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 1));

  return (
    <div className={styles.overlay}>
      <div className={styles.viewer}>
        <button className={styles.closeBtn} onClick={onClose}>
          {t("scanViewer.close")}
        </button>
        <h2>{t("scanViewer.title", { type: scan.type })}</h2>
        <div className={styles.controls}>
          <button onClick={handleZoomIn}>{t("scanViewer.zoomIn")}</button>
          <button onClick={handleZoomOut}>{t("scanViewer.zoomOut")}</button>
        </div>
        <div className={`${styles.imageContainer} ${zoomLevelClass} relative`}>
          <Image
            src={selectedImage}
            alt={t("scanViewer.imageAlt")}
            fill
            sizes="90vw"
            className={styles.image}
          />
        </div>
        <ScanThumbnails
          images={images}
          selected={selectedImage}
          onSelect={setSelectedImage}
        />
        <ScanAnnotations annotations={annotations} />
      </div>
    </div>
  );
}

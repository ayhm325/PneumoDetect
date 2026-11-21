"use client";

import React, { useState } from "react";
import { useTranslations } from "@/lib/compat/intl";
import ScansTable from "../../../doctor/components/ScansTable";
import ScanViewer from "../../../doctor/components/ScanViewer";

export default function ResultsPageContent() {
  const t = useTranslations("doctorResults");

  const [selectedScan, setSelectedScan] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const mockScans = [
    {
      id: 101,
      date: "2025-12-01",
      type: "X-ray",
      aiSummary: t("mock.scan101.aiSummary"),
      comparisonAvailable: true,
      thumbnail: "/scan-xray-thumb.png",
      images: ["/scan-xray-1.png", "/scan-xray-2.png"],
      annotations: [
        {
          text: t("mock.scan101.annotation1.text"),
          position: t("mock.scan101.annotation1.position"),
        },
        {
          text: t("mock.scan101.annotation2.text"),
          position: t("mock.scan101.annotation2.position"),
        },
      ],
    },
    {
      id: 102,
      date: "2025-11-28",
      type: "CT",
      aiSummary: t("mock.scan102.aiSummary"),
      comparisonAvailable: false,
      thumbnail: "/scan-ct-thumb.png",
      images: ["/scan-ct-1.png"],
      annotations: [],
    },
  ];

  const handleView = (scan) => {
    setSelectedScan(scan);
    setViewerOpen(true);
  };
  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedScan(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <ScansTable
        scans={mockScans}
        onView={handleView}
        onCompare={() => {}}
        onAnnotate={() => {}}
      />
      {viewerOpen && selectedScan && (
        <ScanViewer
          scan={selectedScan}
          images={selectedScan.images}
          annotations={selectedScan.annotations}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
}
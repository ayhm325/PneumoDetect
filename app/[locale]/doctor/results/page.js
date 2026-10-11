"use client";

import DoctorLayout from "../DoctorLayout";
import { useToast } from "../../../components/ui/ToastProvider";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  FaXRay,
  FaSearch,
  FaFilter,
  FaEye,
  FaCompressArrowsAlt,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaHourglassHalf,
  FaExclamationTriangle,
  FaFileAlt,
  FaTimes,
  FaExpand,
  FaCompress,
  FaPrint,
} from "react-icons/fa";
import { formatDate } from "../../../lib/date";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button, Card } from "../../../../src/components/ui";

export default function DoctorResultsPage() {
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const locale = useLocale();
  const t = useTranslations("doctorResults");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  const searchParams = useSearchParams();
  const patientId = (searchParams?.get("patientId") || "").trim();

  // ...existing code...
  // Replace all labels.X with t("key")
  // For example: t("title"), t("subtitle"), t("searchPlaceholder"), t("items.0.type"), t("items.0.status"), t("actions.view"), t("viewer.aiAnalysis"), t("emptyState")

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedScan, setSelectedScan] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewClinicalStatus, setReviewClinicalStatus] = useState("stable");
  const [savingReview, setSavingReview] = useState(false);

  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = patientId
      ? `/api/doctor/results?patientId=${encodeURIComponent(patientId)}`
      : "/api/doctor/results";
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("fetch_failed");
        const data = await res.json();
        // Transform API data to match UI expectations
        const inferTypeKey = (rawTitle, imageUrl) => {
          const title =
            typeof rawTitle === "string" ? rawTitle.toLowerCase() : "";
          const url =
            typeof imageUrl === "string" ? imageUrl.toLowerCase() : "";
          const blob = `${title} ${url}`;
          if (blob.includes("ct")) return "ct";
          if (blob.includes("mri")) return "mri";
          if (blob.includes("ultra") || blob.includes("us"))
            return "ultrasound";
          if (
            blob.includes("x-ray") ||
            blob.includes("xray") ||
            blob.includes("cxr")
          )
            return "xray";
          return null;
        };

        const formatTime = (dt) => {
          if (!dt) return "";
          const d = new Date(dt);
          if (Number.isNaN(d.getTime())) return "";
          try {
            return d.toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            });
          } catch {
            return "";
          }
        };

        const mapped = (data.records || []).map((r) => {
          const inferredTypeKey = inferTypeKey(r.title, r.imageUrl);
          const typeKey = inferredTypeKey ?? "xray";
          const typeLabel = inferredTypeKey
            ? t(`scanTypes.${inferredTypeKey}`)
            : r.title || t("scanTypes.xray");

          const confidence =
            typeof r.confidenceScore === "number" ? r.confidenceScore : null;
          const score = confidence == null ? 0 : Math.round(confidence * 100);
          const ai = (r.aiResult || "").toString().toUpperCase();

          const status = r.reviewedByDoctor
            ? "completed"
            : ai === "POSITIVE" && (confidence == null || confidence >= 0.7)
              ? "urgent"
              : "pending";

          const aiSummary = (() => {
            if (ai === "POSITIVE") return t("aiMessages.positive", { score });
            if (ai === "NEGATIVE") return t("aiMessages.negative", { score });
            return t("aiMessages.unknown");
          })();

          const findings = (() => {
            if (ai === "POSITIVE")
              return [
                { type: "warning", text: t("findingsMessages.positive") },
              ];
            if (ai === "NEGATIVE")
              return [{ type: "normal", text: t("findingsMessages.negative") }];
            return r.doctorNotes
              ? [{ type: "info", text: r.doctorNotes }]
              : [{ type: "info", text: t("findingsMessages.unknown") }];
          })();

          return {
            id: r.id,
            patientName: r.patient?.name || placeholder,
            patientId: r.patient?.id || placeholder,
            patientClinicalStatus:
              r.patientClinicalStatus || r.patient?.clinicalStatus || null,
            typeKey,
            typeLabel,
            bodyPart: t("defaults.bodyPart"),
            date: r.createdAt,
            time: formatTime(r.createdAt),
            status,
            aiSummary,
            thumbnail: r.imageUrl || "/icons/xray-placeholder.png",
            findings,
            reviewedByDoctor: Boolean(r.reviewedByDoctor),
            doctorNotes: r.doctorNotes || "",
          };
        });
        setScans(mapped);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err.message === "fetch_failed"
            ? t("errors.fetchResultsFailed")
            : err.message,
        );
        setLoading(false);
      });
  }, [patientId, locale, placeholder, t]);

  const stats = {
    total: scans.length,
    completed: scans.filter((s) => s.status === "completed").length,
    pending: scans.filter((s) => s.status === "pending").length,
    today: scans.filter((s) => {
      const today = new Date();
      const scanDate = new Date(s.date);
      return (
        scanDate.getDate() === today.getDate() &&
        scanDate.getMonth() === today.getMonth() &&
        scanDate.getFullYear() === today.getFullYear()
      );
    }).length,
  };

  const filteredScans = scans.filter((scan) => {
    if (filterType !== "all" && scan.typeKey !== filterType) return false;
    if (filterStatus !== "all" && scan.status !== filterStatus) return false;
    if (searchQuery) {
      return (
        (scan.patientName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (scan.patientId || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (scan.typeLabel || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const handleViewScan = (scan) => {
    setSelectedScan(scan);
    setReviewNotes(scan?.doctorNotes || "");
    setReviewClinicalStatus(scan?.patientClinicalStatus || "stable");
    setViewerOpen(true);
    showInfo(t("toast.viewingScan"));
  };

  const handleMarkReviewed = async () => {
    if (!selectedScan?.id) return;
    setSavingReview(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/doctor/results", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: selectedScan.id,
          reviewedByDoctor: true,
          doctorNotes: reviewNotes,
          clinicalStatus: reviewClinicalStatus,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(body.error || body.message || `HTTP ${res.status}`);

      const nextDoctorNotes =
        typeof reviewNotes === "string" ? reviewNotes.trim() : "";
      const nextFindings = nextDoctorNotes
        ? [
            { type: "info", text: nextDoctorNotes },
            ...(selectedScan.findings || []).filter(
              (f) => f?.text !== nextDoctorNotes,
            ),
          ]
        : selectedScan.findings || [];

      const updatedScan = {
        ...selectedScan,
        status: "completed",
        reviewedByDoctor: true,
        doctorNotes: nextDoctorNotes,
        patientClinicalStatus: reviewClinicalStatus,
        findings: nextFindings,
      };

      setSelectedScan(updatedScan);
      setScans((prev) =>
        prev.map((s) => (s.id === selectedScan.id ? updatedScan : s)),
      );
      showSuccess(t("toast.reviewSaved"));
    } catch (e) {
      showError(t("toast.reviewSaveFailed"));
    } finally {
      setSavingReview(false);
    }
  };

  const handlePrint = (scan) => {
    showInfo(t("toast.printStart"));
  };

  const getStatusBadge = (status) => {
    const config = {
      completed: {
        label: t("statuses.completed"),
        color:
          "bg-(--ui-success-bg) text-(--ui-success) border-(--ui-success-border)",
        icon: FaCheckCircle,
      },
      pending: {
        label: t("statuses.pending"),
        color:
          "bg-(--ui-warning-bg) text-(--ui-warning) border-(--ui-warning-border)",
        icon: FaHourglassHalf,
      },
      urgent: {
        label: t("statuses.urgent"),
        color:
          "bg-(--ui-danger-bg) text-(--ui-danger) border-(--ui-danger-border)",
        icon: FaExclamationTriangle,
      },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span
        className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${c.color}`}
      >
        <Icon />
        {c.label}
      </span>
    );
  };

  const getTypeIcon = (typeKey) => {
    const typeConfig = {
      xray: { icon: "🩻", color: "bg-(--ui-info-bg) text-(--ui-info)" },
      ct: { icon: "🔬", color: "bg-(--ui-info-bg) text-(--ui-info)" },
      mri: { icon: "🧲", color: "bg-(--ui-success-bg) text-(--ui-success)" },
      ultrasound: {
        icon: "📡",
        color: "bg-(--ui-warning-bg) text-(--ui-warning)",
      },
    };
    const config = typeConfig[typeKey] || typeConfig.xray;
    return (
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color} text-xl`}
      >
        {config.icon}
      </div>
    );
  };

  if (loading) {
    return (
      <DoctorLayout>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-(--ui-muted-foreground)">
            {t("loading")}
          </div>
        </div>
      </DoctorLayout>
    );
  }

  if (error) {
    return (
      <DoctorLayout>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-(--ui-danger)">
            {t("error")} {error}
          </div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>

      <div className="min-h-screen bg-(--ui-surface-2) text-(--ui-foreground) p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-(--ui-foreground) flex items-center gap-3">
                <FaXRay className="text-(--ui-info)" />
                {t("title")}
              </h1>
              <p className="mt-2 text-(--ui-muted-foreground)">
                {t("subtitle")}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card size="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {t("stats.total")}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-(--ui-foreground)">
                    {stats.total}
                  </p>
                </div>
                <FaXRay className="text-3xl text-(--ui-info)" />
              </div>
            </Card>

            <Card size="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {t("stats.completed")}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-(--ui-success)">
                    {stats.completed}
                  </p>
                </div>
                <FaCheckCircle className="text-3xl text-(--ui-success)" />
              </div>
            </Card>

            <Card size="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {t("stats.pending")}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-(--ui-warning)">
                    {stats.pending}
                  </p>
                </div>
                <FaHourglassHalf className="text-3xl text-(--ui-warning)" />
              </div>
            </Card>

            <Card size="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {t("stats.today")}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-(--ui-info)">
                    {stats.today}
                  </p>
                </div>
                <FaCalendarAlt className="text-3xl text-(--ui-info)" />
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-62.5">
                <div className="relative">
                  <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-(--ui-muted-foreground)" />
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-(--ui-border) bg-(--ui-surface) py-2 pr-10 pl-4 text-sm text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-(--ui-border) bg-(--ui-surface) px-4 py-2 text-sm font-medium text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
              >
                <option value="all">{t("filters.allStatuses")}</option>
                <option value="completed">{t("status.completed")}</option>
                <option value="pending">{t("status.pending")}</option>
              </select>
            </div>
          </Card>

          {/* Scans Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredScans.map((scan, idx) => (
              <Card
                key={`${scan.id ?? "scan"}-${idx}`}
                variant="interactive"
                className="group"
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  {getTypeIcon(scan.typeKey)}
                  {getStatusBadge(scan.status)}
                </div>

                {/* Patient Info */}
                <div className="mb-4 space-y-2">
                  <h3 className="text-lg font-bold text-(--ui-foreground)">
                    {scan.patientName}
                  </h3>
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {t("patientId")} {scan.patientId}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-(--ui-muted-foreground)">
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt className="text-(--ui-info)" />
                      {formatDate(scan.date, locale, ui("placeholder"))}
                    </div>
                    <div className="flex items-center gap-1">
                      <FaClock className="text-(--ui-info)" />
                      {scan.time}
                    </div>
                  </div>
                </div>

                {/* Scan Details */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-(--ui-foreground)">
                      {t("type")}
                    </span>
                    <span className="text-sm text-(--ui-muted-foreground)">
                      {scan.typeLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-(--ui-foreground)">
                      {t("bodyPart")}
                    </span>
                    <span className="text-sm text-(--ui-muted-foreground)">
                      {scan.bodyPart}
                    </span>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="mb-4 rounded-lg bg-(--ui-info-bg) border border-(--ui-info-border) p-3">
                  <p className="text-xs font-medium text-(--ui-info) mb-1">
                    {t("aiSummary")}
                  </p>
                  <p className="text-sm text-(--ui-foreground)">
                    {scan.aiSummary}
                  </p>
                </div>

                {/* Findings */}
                {scan.findings.length > 0 && (
                  <div className="mb-4 space-y-1">
                    {scan.findings.slice(0, 2).map((finding, idx) => (
                      <div
                        key={idx}
                        className={`text-xs px-2 py-1 rounded ${
                          finding.type === "normal"
                            ? "bg-(--ui-success-bg) text-(--ui-success)"
                            : finding.type === "warning"
                              ? "bg-(--ui-warning-bg) text-(--ui-warning)"
                              : "bg-(--ui-info-bg) text-(--ui-info)"
                        }`}
                      >
                        • {finding.text}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewScan(scan)}
                    size="sm"
                    className="flex items-center justify-center gap-2"
                  >
                    <FaEye />
                    {t("actions.view")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredScans.length === 0 && (
            <Card className="p-12 text-center">
              <FaXRay className="mx-auto mb-4 text-5xl text-(--ui-muted-foreground) opacity-50" />
              <p className="text-lg text-(--ui-muted-foreground)">
                {t("emptyState")}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewerOpen && selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-neutral)/90 p-4">
          <div
            className={`relative card-glass rounded-xl shadow-(--shadow-lift) overflow-hidden border border-(--ui-border) ${isFullscreen ? "w-full h-full" : "max-w-5xl w-full max-h-[90vh]"}`}
          >
            {/* Viewer Header */}
            <div className="flex items-center justify-between border-b border-(--ui-border) bg-(--ui-surface) p-4">
              <div>
                <h2 className="text-xl font-bold text-(--ui-foreground)">
                  {selectedScan.patientName}
                </h2>
                <p className="text-sm text-(--ui-muted-foreground)">
                  {selectedScan.typeLabel} - {selectedScan.bodyPart}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="rounded-lg p-2 text-(--ui-muted-foreground) transition-all hover:bg-(--ui-surface-2)"
                  title={
                    isFullscreen
                      ? t("viewer.exitFullscreen")
                      : t("viewer.fullscreen")
                  }
                >
                  {isFullscreen ? <FaCompress /> : <FaExpand />}
                </button>
                {/* Download and Share buttons removed as requested */}
                <button
                  onClick={() => setViewerOpen(false)}
                  className="rounded-lg p-2 text-(--ui-muted-foreground) transition-all hover:bg-(--ui-surface-2)"
                  title={t("actions.close")}
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div
              className={`overflow-y-auto p-6 ${isFullscreen ? "max-h-[calc(100vh-80px)]" : "max-h-[70vh]"}`}
            >
              <div className="mb-6 relative w-full overflow-hidden rounded-lg border border-(--ui-border) aspect-video bg-(--color-neutral)">
                <Image
                  src={selectedScan.thumbnail}
                  alt={selectedScan.patientName}
                  fill
                  sizes="(min-width: 1024px) 900px, 100vw"
                  className="object-contain"
                />
              </div>

              {/* AI Analysis */}
              <div className="rounded-lg bg-(--ui-info-bg) border border-(--ui-info-border) p-4 mb-4">
                <h3 className="font-bold text-(--ui-info) mb-2 flex items-center gap-2">
                  <FaFileAlt />
                  {t("viewer.aiAnalysis")}
                </h3>
                <p className="text-(--ui-foreground)">
                  {selectedScan.aiSummary}
                </p>
              </div>

              {/* Findings */}
              {selectedScan.findings.length > 0 && (
                <div className="rounded-lg bg-(--ui-surface-2) border border-(--ui-border) p-4">
                  <h3 className="font-bold text-(--ui-foreground) mb-3">
                    {t("viewer.findings")}:{" "}
                  </h3>
                  <div className="space-y-2">
                    {selectedScan.findings.map((finding, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${
                          finding.type === "normal"
                            ? "bg-(--ui-success-bg) border border-(--ui-success-border)"
                            : finding.type === "warning"
                              ? "bg-(--ui-warning-bg) border border-(--ui-warning-border)"
                              : "bg-(--ui-info-bg) border border-(--ui-info-border)"
                        }`}
                      >
                        <p className="text-sm font-medium">{finding.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor Review */}
              <div className="mt-4 rounded-lg bg-(--ui-surface-2) border border-(--ui-border) p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h3 className="font-bold text-(--ui-foreground)">
                    {t("viewer.review.title")}
                  </h3>
                  <div className="flex items-center gap-2">
                    {selectedScan.reviewedByDoctor && (
                      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium bg-(--ui-success-bg) text-(--ui-success) border-(--ui-success-border)">
                        <FaCheckCircle />
                        {t("viewer.review.reviewed")}
                      </span>
                    )}
                  </div>
                </div>

                <label className="block text-sm font-medium text-(--ui-muted-foreground) mb-2">
                  {t("viewer.review.notesLabel")}
                </label>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-(--ui-muted-foreground) mb-2">
                    {t("viewer.review.clinicalStatusLabel")}
                  </label>
                  <select
                    value={reviewClinicalStatus}
                    onChange={(e) => setReviewClinicalStatus(e.target.value)}
                    className="w-full rounded-xl border border-(--ui-border) bg-(--ui-surface) px-4 py-3 text-sm font-medium text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring)/20"
                  >
                    <option value="stable">
                      {t("viewer.review.clinicalStatuses.stable")}
                    </option>
                    <option value="critical">
                      {t("viewer.review.clinicalStatuses.critical")}
                    </option>
                    <option value="recovering">
                      {t("viewer.review.clinicalStatuses.recovering")}
                    </option>
                  </select>
                </div>

                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  placeholder={t("viewer.review.notesPlaceholder")}
                  className="w-full px-4 py-3 bg-(--ui-surface) border border-(--ui-border) rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) outline-none transition-all text-(--ui-foreground) resize-none"
                />

                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    onClick={handleMarkReviewed}
                    disabled={savingReview}
                    fullWidth={false}
                    size="sm"
                  >
                    {savingReview
                      ? t("viewer.review.saving")
                      : t("viewer.review.markReviewed")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}

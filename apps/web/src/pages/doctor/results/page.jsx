"use client";

import { CalendarDaysIcon, CircleCheckIcon, ClockIcon, EyeIcon, FileTextIcon, HourglassIcon, ListFilterIcon, MaximizeIcon, Minimize2Icon, MinimizeIcon, PrinterIcon, ScanLineIcon, SearchIcon, TriangleAlertIcon, UserIcon, XIcon } from "lucide-react";
import DoctorLayout from "../DoctorLayout";
import { useToast } from "@/components/ui/ToastProvider";
import Image from "@/lib/compat/Image";
import { useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/date";
import {
  getReviewStatusLabel,
  resolveCanonicalReviewStatus,
} from "@/lib/analysisStatus";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import { useSearchParams } from "@/lib/compat/navigation";
import { apiRequest } from "@/lib/apiClient";
import { Button, Card, GlideSelect, MetricCard, ProfileMediaCard } from "@/components/ui";

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
    apiRequest(url)
      .then((data) => {
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

          const reviewStatus = resolveCanonicalReviewStatus(r);
          const status =
            reviewStatus === "reviewed"
              ? "completed"
              : reviewStatus === "requires_review"
                ? "requires_review"
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
            reviewStatus,
            needsReview: Boolean(r.needsReview),
            aiSummary,
            thumbnail: r.imageUrl || "/icons/xray-placeholder.png",
            heatmapUrl: r.heatmapUrl || null,
            uploadNotes: r.uploadNotes || "",
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
    requiresReview: scans.filter((s) => s.status === "requires_review").length,
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
    if (filterStatus !== "all") {
      if (scan.status !== filterStatus) {
        return false;
      }
    }
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
    if (!selectedScan?.id || savingReview) return;
    setSavingReview(true);
    try {
      const body = await apiRequest("/api/doctor/results", {
        method: "PATCH",
        body: JSON.stringify({
          id: selectedScan.id,
          reviewedByDoctor: true,
          doctorNotes: reviewNotes,
          clinicalStatus: reviewClinicalStatus,
        }),
      });

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

      const serverRec = body?.record || null;
      const nextReviewed = serverRec
        ? Boolean(serverRec.reviewedByDoctor)
        : true;
      const nextReviewStatus = resolveCanonicalReviewStatus(
        serverRec || { reviewedByDoctor: nextReviewed, needsReview: selectedScan.needsReview },
      );
      const nextStatus =
        nextReviewStatus === "reviewed"
          ? "completed"
          : nextReviewStatus === "requires_review"
            ? "requires_review"
            : "pending";

      const updatedScan = {
        ...selectedScan,
        status: nextStatus,
        reviewStatus: nextReviewStatus,
        reviewedByDoctor: nextReviewed,
        thumbnail: serverRec?.imageUrl || selectedScan.thumbnail,
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
        label: getReviewStatusLabel("reviewed", locale),
        color:
          "bg-(--ui-success-bg) text-(--ui-success) border-(--ui-success-border)",
        icon: CircleCheckIcon,
      },
      requires_review: {
        label: getReviewStatusLabel("requires_review", locale),
        color:
          "bg-(--ui-warning-bg) text-(--ui-warning) border-(--ui-warning-border)",
        icon: TriangleAlertIcon,
      },
      pending: {
        label: getReviewStatusLabel("pending_review", locale),
        color:
          "bg-(--ui-info-bg) text-(--ui-info) border-(--ui-info-border)",
        icon: HourglassIcon,
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
                <ScanLineIcon className="text-(--ui-info)" />
                {t("title")}
              </h1>
              <p className="mt-2 text-(--ui-muted-foreground)">
                {t("subtitle")}
              </p>
            </div>
          </div>

          {/* Stats Cards — Equal 25/25/25/25 Bento Row */}
          <div className="pd-bento-grid">
            <div className="pd-span-3">
              <MetricCard
                id="doc-results-total"
                label={t("stats.total")}
                value={stats.total}
                icon={ScanLineIcon}
                tone="olive"
                layout="editorial"
              />
            </div>
            <div className="pd-span-3">
              <MetricCard
                id="doc-results-completed"
                label={t("stats.completed")}
                value={stats.completed}
                icon={CircleCheckIcon}
                tone="sage"
                layout="visual"
              />
            </div>
            <div className="pd-span-3">
              <MetricCard
                id="doc-results-pending"
                label={t("stats.pending")}
                value={stats.pending}
                icon={HourglassIcon}
                tone="cream"
                layout="compact"
              />
            </div>
            <div className="pd-span-3">
              <MetricCard
                id="doc-results-today"
                label={t("stats.today")}
                value={stats.today}
                icon={CalendarDaysIcon}
                tone="red"
                layout="editorial"
              />
            </div>
          </div>

          {/* Filters */}
          <Card variant="feature">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-62.5">
                <div className="relative">
                  <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-(--ui-muted-foreground)" />
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
              <GlideSelect
                value={filterStatus}
                onChange={(val) => setFilterStatus(val)}
                options={[
                  { value: "all", label: t("filters.allStatuses") },
                  { value: "completed", label: t("status.completed") },
                  { value: "pending", label: t("status.pending") },
                  {
                    value: "requires_review",
                    label: getReviewStatusLabel("requires_review", locale),
                  },
                ]}
              />
            </div>
          </Card>

          {/* Scans Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredScans.map((scan, idx) => (
              <ProfileMediaCard
                key={`${scan.id ?? "scan"}-${idx}`}
                image={scan.thumbnail}
                imageAlt={scan.patientName}
                title={scan.patientName}
                subtitle={`${scan.typeLabel} • ${scan.bodyPart}`}
                badge={getStatusBadge(scan.status)}
                actions={
                  <Button
                    onClick={() => handleViewScan(scan)}
                    size="sm"
                    className="flex items-center justify-center gap-2"
                  >
                    <EyeIcon />
                    {t("actions.view")}
                  </Button>
                }
              >
                <div className="mb-3 space-y-1 text-xs text-(--ui-muted-foreground)">
                  <p>
                    {t("patientId")} {scan.patientId}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDaysIcon className="text-(--ui-info)" />
                      {formatDate(scan.date, locale, ui("placeholder"))}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="text-(--ui-info)" />
                      {scan.time}
                    </span>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="mb-3 rounded-xl bg-(--ui-info-bg) border border-(--ui-info-border) p-3">
                  <p className="text-xs font-medium text-(--ui-info) mb-1">
                    {t("aiSummary")}
                  </p>
                  <p className="text-sm text-(--ui-foreground)">
                    {scan.aiSummary}
                  </p>
                </div>

                {/* Findings */}
                {scan.findings.length > 0 && (
                  <div className="space-y-1">
                    {scan.findings.slice(0, 2).map((finding, fIdx) => (
                      <div
                        key={fIdx}
                        className={`text-xs px-2.5 py-1 rounded-lg ${
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
              </ProfileMediaCard>
            ))}
          </div>

          {filteredScans.length === 0 && (
            <Card variant="clinical" className="p-12 text-center">
              <ScanLineIcon className="mx-auto mb-4 text-5xl text-(--ui-muted-foreground) opacity-50" />
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
            className={`relative pd-panel pd-shape-asymmetric shadow-(--shadow-lift) overflow-hidden border border-(--ui-border) ${isFullscreen ? "w-full h-full" : "max-w-5xl w-full max-h-[90vh]"}`}
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
                  {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
                </button>
                {/* Download and Share buttons removed as requested */}
                <button
                  onClick={() => setViewerOpen(false)}
                  className="rounded-lg p-2 text-(--ui-muted-foreground) transition-all hover:bg-(--ui-surface-2)"
                  title={t("actions.close")}
                >
                  <XIcon />
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
                  <FileTextIcon />
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
                        <CircleCheckIcon />
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
                  <GlideSelect
                    fullWidth
                    size="lg"
                    value={reviewClinicalStatus}
                    onChange={(val) => setReviewClinicalStatus(val)}
                    options={[
                      {
                        value: "stable",
                        label: t("viewer.review.clinicalStatuses.stable"),
                      },
                      {
                        value: "critical",
                        label: t("viewer.review.clinicalStatuses.critical"),
                      },
                      {
                        value: "recovering",
                        label: t("viewer.review.clinicalStatuses.recovering"),
                      },
                    ]}
                  />
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
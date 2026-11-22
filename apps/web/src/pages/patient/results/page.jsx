"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "@/lib/compat/Image";
import { useToast } from "@/components/ui/ToastProvider";
import {
  FaFileAlt,
  FaXRay,
  FaSearch,
  FaFilter,
  FaEye,
  FaTimes,
  FaCheckCircle,
  FaHourglassHalf,
  FaExclamationTriangle,
  FaDownload,
  FaShareAlt,
  FaPrint,
} from "react-icons/fa";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import {
  getReviewStatusLabel,
  resolveCanonicalReviewStatus,
  resolveClinicalPriority,
} from "@/lib/analysisStatus";
import { apiFetch, apiRequest } from "@/lib/apiClient";
import { Button, Card, GlideSelect, ProfileMediaCard, StatCard } from "@/components/ui";

export default function PatientResultsPage() {
  const { showSuccess, showError, showInfo } = useToast();
  const locale = useLocale();
  const t = useTranslations("patientResults");
  const labels = t;

  const formatClinicalStatus = useCallback(
    (value) => {
      const raw = value == null ? "" : String(value).trim();
      if (!raw) return t("placeholder");
      const key = raw.toLowerCase();
      if (key === "stable" || key === "critical" || key === "recovering") {
        try {
          return t(`clinicalStatuses.${key}`);
        } catch {
          return t("placeholder");
        }
      }
      return t("placeholder");
    },
    [t],
  );

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const inferTypeKey = (imageUrl) => {
    const u = String(imageUrl || "").toLowerCase();
    if (u.includes("ct")) return "ct";
    if (u.includes("mri")) return "mri";
    if (u.includes("ultra") || u.includes("us")) return "ultrasound";
    if (u.includes("lab")) return "lab";
    if (u.includes("xray") || u.includes("x-ray") || u.includes("cxr"))
      return "xray";
    return "xray";
  };

  const formatDate = (dt) => {
    if (!dt) return "";
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const formatTime = useCallback(
    (dt) => {
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
    },
    [locale],
  );

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest("/api/patient/results");
      const mapped = (data?.records || [])
        .map((r) => {
          const typeKey = inferTypeKey(r.imageUrl);
          const typeLabel = (() => {
            try {
              return t(`types.${typeKey}`);
            } catch {
              return typeKey;
            }
          })();

          const reviewStatus = resolveCanonicalReviewStatus(r);
          const status =
            reviewStatus === "reviewed"
              ? "ready"
              : reviewStatus === "requires_review"
                ? "requires_review"
                : "pending";
          const ai = (r.aiResult || "").toString().toUpperCase();
          const confidence =
            typeof r.confidenceScore === "number" ? r.confidenceScore : null;
          const priority = resolveClinicalPriority(r);
          const aiSummary = (() => {
            if (ai === "POSITIVE")
              return t("aiSummary.positive", {
                score: confidence == null ? "" : Math.round(confidence * 100),
              });
            if (ai === "NEGATIVE")
              return t("aiSummary.negative", {
                score: confidence == null ? "" : Math.round(confidence * 100),
              });
            return t("aiSummary.unknown");
          })();

          const findings = (() => {
            if (ai === "POSITIVE")
              return [{ type: "warning", text: t("findings.positive") }];
            if (ai === "NEGATIVE")
              return [{ type: "normal", text: t("findings.negative") }];
            return [{ type: "info", text: t("findings.unknown") }];
          })();

          return {
            id: r.id,
            title: t("titles.default"),
            type: typeLabel,
            date: formatDate(r.createdAt),
            time: formatTime(r.createdAt),
            status,
            reviewStatus,
            priority,
            doctor: r.doctor?.name || t("defaults.unknownDoctor"),
            facility:
              r.doctor?.clinic ||
              (r.doctor?.name
                ? t("defaults.clinicOfDoctor", { name: r.doctor.name })
                : t("defaults.unknownFacility")),
            aiSummary,
            findings,
            notes: r.doctorNotes || "",
            images: r.imageUrl ? [r.imageUrl] : [],
            createdAt: r.createdAt,
            clinicalStatus: formatClinicalStatus(r.clinicalStatus),
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReports(mapped);
    } catch (err) {
      setError(err?.message || "Failed to load patient results");
    } finally {
      setLoading(false);
    }
  }, [t, formatTime, formatClinicalStatus]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const statsLabels = {
    total: t("stats.total"),
    ready: t("stats.ready"),
    pending: t("stats.pending"),
    requiresReview:
      locale === "ar" ? "تحتاج مراجعة الطبيب" : "Needs Physician Review",
  };

  const normalizeToken = (value) => String(value ?? "").trim().toLowerCase();
  const normalizeStatus = (status) => {
    const token = normalizeToken(status);
    if (token === "ready" || token === "reviewed") return "ready";
    if (token === "requires_review") return "requires_review";
    if (token === "pending" || token === "pending_review") return "pending";
    return "unknown";
  };

  const normalizePriority = (priority) => {
    const token = normalizeToken(priority);
    if (token === "urgent") return "urgent";
    return "normal";
  };

  const getStatusColor = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === "ready")
      return "bg-(--ui-success-bg) text-(--ui-success) border-(--ui-success-border)";
    if (normalized === "requires_review")
      return "bg-(--ui-warning-bg) text-(--ui-warning) border-(--ui-warning-border)";
    if (normalized === "pending")
      return "bg-(--ui-info-bg) text-(--ui-info) border-(--ui-info-border)";
    return "bg-(--ui-surface-2) text-(--ui-muted-foreground) border-(--ui-border)";
  };

  const getPriorityColor = (priority) => {
    const normalized = normalizePriority(priority);
    if (normalized === "urgent")
      return "bg-(--ui-danger-bg) text-(--ui-danger) border-(--ui-danger-border)";
    return "bg-(--ui-surface-2) text-(--ui-muted-foreground) border-(--ui-border)";
  };

  const getFindingColor = (type) => {
    if (type === "normal") return "text-(--ui-success)";
    if (type === "warning") return "text-(--ui-warning)";
    if (type === "info") return "text-(--ui-info)";
    return "text-(--ui-muted-foreground)";
  };

  const getFindingIcon = (type) => {
    if (type === "normal") return "✓";
    if (type === "warning") return "⚠";
    if (type === "info") return "ℹ";
    return "•";
  };

  const getStatusLabel = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === "ready") return getReviewStatusLabel("reviewed", locale);
    if (normalized === "requires_review")
      return getReviewStatusLabel("requires_review", locale);
    if (normalized === "pending")
      return getReviewStatusLabel("pending_review", locale);
    return status;
  };

  const getPriorityLabel = (priority) => {
    const normalized = normalizePriority(priority);
    if (normalized === "urgent") return labels("priorities.urgent");
    return labels("priorities.normal");
  };

  const stats = [
    {
      title: statsLabels.total,
      value: reports.length,
      icon: <FaFileAlt />,
      tone: "info",
    },
    {
      title: statsLabels.ready,
      value: reports.filter((r) => normalizeStatus(r.status) === "ready")
        .length,
      icon: <FaCheckCircle />,
      tone: "success",
    },
    {
      title: statsLabels.pending,
      value: reports.filter((r) => normalizeStatus(r.status) === "pending")
        .length,
      icon: <FaHourglassHalf />,
      tone: "info",
    },
    {
      title: statsLabels.requiresReview,
      value: reports.filter(
        (r) => normalizeStatus(r.status) === "requires_review",
      ).length,
      icon: <FaExclamationTriangle />,
      tone: "warning",
    },
  ];

  // Real Download implementation
  const handleDownload = async (report) => {
    const target = report || selectedReport;
    if (!target) return;
    setDownloadingId(target.id);
    try {
      const imageUrl = target.images?.[0];
      if (imageUrl) {
        const res = await apiFetch(imageUrl);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const ext = blob.type.includes("png")
          ? "png"
          : blob.type.includes("webp")
            ? "webp"
            : "jpg";
        a.download = `PneumoDetect-Report-${target.date || target.id}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        showSuccess(labels("toast.download"));
      } else {
        throw new Error(
          locale === "ar"
            ? "لا توجد صورة متاحة للتنزيل في هذا التقرير"
            : "No medical image available to download",
        );
      }
    } catch (err) {
      showError(
        err?.message ||
          (locale === "ar" ? "فشل تنزيل التقرير" : "Failed to download report"),
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // Real Share implementation (shares protected portal summary/URL, never raw private image token)
  const handleShare = async (report) => {
    const target = report || selectedReport;
    if (!target || typeof window === "undefined") return;
    const portalUrl = `${window.location.origin}/patient/results`;
    const summaryText = `${target.title} (${target.date}) - ${getStatusLabel(target.status)}`;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: target.title,
          text: summaryText,
          url: portalUrl,
        });
        showSuccess(labels("toast.share"));
        return;
      }
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(`${summaryText}\n${portalUrl}`);
        showSuccess(labels("toast.share"));
        return;
      }
      throw new Error(
        locale === "ar"
          ? "المشاركة غير مدعومة في هذا المتصفح"
          : "Sharing is not supported in this browser",
      );
    } catch (err) {
      if (err?.name === "AbortError") return;
      showError(
        err?.message ||
          (locale === "ar" ? "تعذرت مشاركة التقرير" : "Could not share report"),
      );
    }
  };

  // Real Print implementation
  const handlePrint = (report) => {
    const target = report || selectedReport;
    if (!target || typeof window === "undefined") return;
    setSelectedReport(target);
    setShowImageModal(true);
    showInfo(labels("toast.print"));
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const filteredReports = reports.filter((report) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (report.title || "").toLowerCase().includes(q) ||
      (report.doctor || "").toLowerCase().includes(q) ||
      (report.type || "").toLowerCase().includes(q);
    const matchesType = filterType === "all" || report.type === filterType;
    const matchesStatus =
      filterStatus === "all" || normalizeStatus(report.status) === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-(--ui-surface) text-(--ui-foreground) p-6">
      {/* Header */}
      <div className="mb-8 print:hidden">
        <h1 className="text-3xl font-bold text-(--ui-foreground)">
          {labels("title")}
        </h1>
        <p className="text-(--ui-muted-foreground) mt-2">
          {labels("subtitle")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:hidden">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            label={stat.title}
            value={stat.value}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </div>

      {error && (
        <Card className="mb-6 border-(--ui-danger-border) bg-(--ui-danger-bg) p-4 text-(--ui-danger) print:hidden">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button size="sm" variant="secondary" onClick={loadReports}>
              {locale === "ar" ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-8 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-(--ui-muted-foreground)" />
            <input
              type="text"
              placeholder={labels("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface) text-(--ui-foreground) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring)"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-(--ui-muted-foreground) shrink-0" />
            <GlideSelect
              fullWidth
              size="lg"
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { value: "all", label: labels("filters.allStatuses") },
                { value: "ready", label: labels("statuses.ready") },
                { value: "pending", label: labels("statuses.pending") },
                {
                  value: "requires_review",
                  label: getReviewStatusLabel("requires_review", locale),
                },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Reports Grid */}
      {loading ? (
        <Card className="p-12 text-center text-(--ui-muted-foreground) print:hidden">
          {locale === "ar" ? "جاري تحميل النتائج..." : "Loading results..."}
        </Card>
      ) : filteredReports.length === 0 ? (
        <Card className="p-12 text-center print:hidden">
          <FaFileAlt className="text-6xl text-(--ui-muted-foreground) mx-auto mb-4" />
          <p className="text-(--ui-muted-foreground) text-lg">
            {labels("emptyState")}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
          {filteredReports.map((report) => (
            <ProfileMediaCard
              key={report.id}
              image={report.images?.[0] || null}
              imageAlt={report.title}
              mediaNode={<FaXRay className="text-xl" />}
              title={report.title}
              subtitle={`${report.type} • ${report.doctor}`}
              badge={
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`px-3 py-1 rounded-full text-xs border font-bold drop-shadow-sm ${getStatusColor(report.status)}`}
                  >
                    {getStatusLabel(report.status)}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs border font-bold drop-shadow-sm ${getPriorityColor(report.priority)}`}
                  >
                    {getPriorityLabel(report.priority)}
                  </span>
                </div>
              }
              actions={
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <Button
                    onClick={() => {
                      setSelectedReport(report);
                      setShowImageModal(true);
                    }}
                    size="sm"
                    fullWidth={false}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <FaEye />
                    <span>{labels("actions.view")}</span>
                  </Button>
                  <Button
                    onClick={() => handleDownload(report)}
                    disabled={downloadingId === report.id}
                    isLoading={downloadingId === report.id}
                    variant="secondary"
                    size="sm"
                    fullWidth={false}
                    title={locale === "ar" ? "تنزيل" : "Download"}
                  >
                    <FaDownload />
                  </Button>
                  <Button
                    onClick={() => handleShare(report)}
                    variant="secondary"
                    size="sm"
                    fullWidth={false}
                    title={locale === "ar" ? "مشاركة" : "Share"}
                  >
                    <FaShareAlt />
                  </Button>
                  <Button
                    onClick={() => handlePrint(report)}
                    variant="secondary"
                    size="sm"
                    fullWidth={false}
                    title={locale === "ar" ? "طباعة" : "Print"}
                  >
                    <FaPrint />
                  </Button>
                </div>
              }
            >
              <div className="space-y-1.5 mb-3 text-sm text-(--ui-muted-foreground)">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {labels("reportLabels.facility")}
                  </span>
                  <span>{report.facility}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {labels("reportLabels.date")}
                  </span>
                  <span>
                    {report.date} - {report.time}
                  </span>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-(--ui-info-bg) rounded-xl p-3.5 mb-3 border border-(--ui-info-border)">
                <span className="text-(--ui-info) font-bold text-xs block">
                  {labels("reportLabels.aiSummary")}
                </span>
                <p className="text-sm text-(--ui-foreground) mt-1">
                  {report.aiSummary}
                </p>
              </div>

              {/* Clinical Status */}
              <div className="notes-box mb-3 text-sm">
                <span className="font-bold">
                  {labels("reportLabels.clinicalStatus")}:{" "}
                </span>
                <span>{report.clinicalStatus}</span>
              </div>

              {/* Findings */}
              <div className="mb-3">
                <h4 className="font-bold text-(--ui-foreground) mb-1.5 text-xs">
                  {labels("reportLabels.findings")}
                </h4>
                <div className="space-y-1">
                  {report.findings.map((finding, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 text-xs ${getFindingColor(finding.type)}`}
                    >
                      <span className="font-bold">
                        {getFindingIcon(finding.type)}
                      </span>
                      <span>{finding.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {report.notes && (
                <div className="bg-(--ui-surface-2)/40 rounded-xl p-3 border border-(--ui-border)">
                  <p className="text-xs font-medium text-(--ui-foreground) mb-1">
                    {labels("reportLabels.notes")}
                  </p>
                  <p className="text-xs text-(--ui-muted-foreground)">
                    {report.notes}
                  </p>
                </div>
              )}
            </ProfileMediaCard>
          ))}
        </div>
      )}

      {/* Image Viewer & Printable Report Modal */}
      {showImageModal && selectedReport && (
        <div className="fixed inset-0 bg-(--color-neutral)/80 flex items-center justify-center z-50 p-4 print:static print:bg-transparent print:p-0">
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto p-0 print:max-h-none print:shadow-none print:border-0">
            <div className="sticky top-0 bg-(--ui-surface) border-b border-(--ui-border) p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold text-(--ui-foreground)">
                  {selectedReport.title}
                </h3>
                <p className="text-sm text-(--ui-muted-foreground)">
                  {selectedReport.type} - {selectedReport.date}
                </p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <Button
                  size="sm"
                  variant="secondary"
                  fullWidth={false}
                  disabled={downloadingId === selectedReport.id}
                  isLoading={downloadingId === selectedReport.id}
                  onClick={() => handleDownload(selectedReport)}
                >
                  <FaDownload />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  fullWidth={false}
                  onClick={() => handleShare(selectedReport)}
                >
                  <FaShareAlt />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  fullWidth={false}
                  onClick={() => window.print()}
                >
                  <FaPrint />
                </Button>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="p-2 hover:bg-(--ui-surface-2)/60 rounded-lg transition-colors"
                >
                  <FaTimes className="text-xl text-(--ui-muted-foreground)" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Status & Priority */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs border font-bold ${getStatusColor(selectedReport.status)}`}
                >
                  {getStatusLabel(selectedReport.status)}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs border font-bold ${getPriorityColor(selectedReport.priority)}`}
                >
                  {getPriorityLabel(selectedReport.priority)}
                </span>
              </div>

              {/* AI Summary */}
              <div className="bg-(--ui-info-bg) border border-(--ui-info-border) rounded-lg p-4 mb-6">
                <h4 className="font-bold text-(--ui-info) mb-2">
                  {labels("reportLabels.aiSummary")}
                </h4>
                <p className="text-(--ui-foreground)">
                  {selectedReport.aiSummary}
                </p>
              </div>

              {/* Findings */}
              <div className="mb-6">
                <h4 className="font-bold text-(--ui-foreground) mb-3">
                  {labels("reportLabels.findings")}
                </h4>
                <div className="space-y-2">
                  {selectedReport.findings.map((finding, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-lg bg-(--ui-surface-2)/40 border border-(--ui-border) ${getFindingColor(finding.type)}`}
                    >
                      <span className="font-bold text-lg">
                        {getFindingIcon(finding.type)}
                      </span>
                      <span>{finding.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Images */}
              {selectedReport.images.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-(--ui-foreground) mb-3">
                    {t("modal.medicalImages")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square bg-(--ui-surface-2) border border-(--ui-border) rounded-lg overflow-hidden"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FaXRay className="text-6xl text-(--ui-muted-foreground)" />
                        </div>
                        <Image
                          src={img}
                          alt={selectedReport.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                          unoptimized
                          onError={(e) => {
                            try {
                              e.currentTarget.style.display = "none";
                            } catch {}
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor Info */}
              <div className="bg-(--ui-surface-2)/40 border border-(--ui-border) rounded-lg p-4">
                <h4 className="font-bold text-(--ui-foreground) mb-2">
                  {t("modal.doctorInformation")}
                </h4>
                <div className="space-y-1 text-sm text-(--ui-muted-foreground)">
                  <p>
                    <span className="font-medium">
                      {labels("reportLabels.doctor")}
                    </span>{" "}
                    {selectedReport.doctor}
                  </p>
                  <p>
                    <span className="font-medium">
                      {labels("reportLabels.facility")}
                    </span>{" "}
                    {selectedReport.facility}
                  </p>
                  <p>
                    <span className="font-medium">
                      {labels("reportLabels.date")}
                    </span>{" "}
                    {selectedReport.date} - {selectedReport.time}
                  </p>
                  <p>
                    <span className="font-medium">
                      {labels("reportLabels.clinicalStatus")}:
                    </span>{" "}
                    {selectedReport.clinicalStatus}
                  </p>
                  {selectedReport.notes && (
                    <p className="mt-2 pt-2 border-t border-(--ui-border)">
                      <span className="font-medium">
                        {labels("reportLabels.notes")}:
                      </span>{" "}
                      {selectedReport.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

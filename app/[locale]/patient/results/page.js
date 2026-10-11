"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "../../../components/ui/ToastProvider";
import {
  FaFileAlt,
  FaXRay,
  FaSearch,
  FaFilter,
  FaEye,
  FaTimes,
  FaCheckCircle,
  FaHourglassHalf,
} from "react-icons/fa";
import { useLocale, useTranslations } from "next-intl";
import { Button, Card } from "../../../../src/components/ui";

export default function PatientResultsPage() {
  const router = useRouter();
  const { showSuccess, showInfo } = useToast();
  const locale = useLocale();
  const t = useTranslations("patientResults");
  const labels = t;

  // دالة تنسيق الحالة السريرية كما في dashboard
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
      [t]
    );

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);

  // Helpers
  const inferTypeKey = (imageUrl) => {
    const u = String(imageUrl || "").toLowerCase();
    if (u.includes("ct")) return "ct";
    if (u.includes("mri")) return "mri";
    if (u.includes("ultra") || u.includes("us")) return "ultrasound";
    if (u.includes("lab")) return "lab";
    if (u.includes("xray") || u.includes("x-ray") || u.includes("cxr")) return "xray";
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
        return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
      } catch {
        return "";
      }
    },
    [locale]
  );

  // Fetch reports
  useEffect(() => {
    Promise.resolve().then(async () => {
      try {
        const res = await fetch("/api/patient/results");
        if (!res.ok) return;
        const data = await res.json();
        const mapped = (data.records || []).map((r) => {
          const typeKey = inferTypeKey(r.imageUrl);
          const typeLabel = (() => {
            try {
              return t(`types.${typeKey}`);
            } catch {
              return typeKey;
            }
          })();

          const status = r.reviewedByDoctor ? "ready" : "pending";
          const ai = (r.aiResult || "").toString().toUpperCase();
          const confidence = typeof r.confidenceScore === "number" ? r.confidenceScore : null;
          const priority = ai === "POSITIVE" && (confidence == null || confidence >= 0.7) ? "urgent" : "normal";
          const aiSummary = (() => {
            if (ai === "POSITIVE") return t("aiSummary.positive", { score: confidence == null ? "" : Math.round(confidence * 100) });
            if (ai === "NEGATIVE") return t("aiSummary.negative", { score: confidence == null ? "" : Math.round(confidence * 100) });
            return t("aiSummary.unknown");
          })();

          const findings = (() => {
            if (ai === "POSITIVE") return [{ type: "warning", text: t("findings.positive") }];
            if (ai === "NEGATIVE") return [{ type: "normal", text: t("findings.negative") }];
            return [{ type: "info", text: t("findings.unknown") }];
          })();

          return {
            id: r.id,
            title: t("titles.default"),
            type: typeLabel,
            typeIcon:
              typeKey === "xray" ? "🩻" :
              typeKey === "ct" ? "🔬" :
              typeKey === "mri" ? "🧲" :
              typeKey === "ultrasound" ? "📡" : "📄",
            date: formatDate(r.createdAt),
            time: formatTime(r.createdAt),
            status,
            priority,
            doctor: r.doctor?.name || t("defaults.unknownDoctor"),
            facility: r.doctor?.clinic || (r.doctor?.name ? t("defaults.clinicOfDoctor", { name: r.doctor.name }) : t("defaults.unknownFacility")),
            aiSummary,
            findings,
            notes: r.doctorNotes || "",
            images: r.imageUrl ? [r.imageUrl] : [],
            createdAt: r.createdAt,
            clinicalStatus: formatClinicalStatus(r.clinicalStatus),
          };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReports(mapped);
      } catch (err) {
        console.error("Failed to load patient results:", err);
      }
    });
  }, [t, locale, formatTime, formatClinicalStatus]);

  // Stats labels
  const statsLabels = {
    total: t("stats.total"),
    ready: t("stats.ready"),
    pending: t("stats.pending"),
    thisMonth: t("stats.thisMonth"),
  };

  // Color helpers
  const getStatusColor = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === "ready") return "bg-green-600 text-white border-green-700 dark:bg-green-500 dark:text-white dark:border-green-300";
    if (normalized === "pending") return "bg-yellow-400 text-black border-yellow-600 dark:bg-yellow-300 dark:text-black dark:border-yellow-500";
    if (normalized === "urgent") return "bg-red-600 text-white border-red-700 dark:bg-red-500 dark:text-white dark:border-red-300";
    return "bg-gray-200 text-gray-700 border-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-500";
  };
  const getPriorityColor = (priority) => {
    const normalized = normalizePriority(priority);
    if (normalized === "urgent") return "bg-red-600 text-white border-red-700 dark:bg-red-500 dark:text-white dark:border-red-300";
    if (normalized === "normal") return "bg-blue-600 text-white border-blue-700 dark:bg-blue-500 dark:text-white dark:border-blue-300";
    return "bg-gray-200 text-gray-700 border-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-500";
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

  // Normalization functions
  const normalizeToken = (value) => String(value ?? "").trim().toLowerCase();
  const tokenInList = (value, list) => {
    const token = normalizeToken(value);
    if (!token) return false;
    return Array.isArray(list) && list.some((x) => normalizeToken(x) === token);
  };
  const statusSynonyms = typeof t.raw === "function" ? t.raw("statusSynonyms") || {} : {};
  const prioritySynonyms = typeof t.raw === "function" ? t.raw("prioritySynonyms") || {} : {};
  const normalizeStatus = (status) => {
    const token = normalizeToken(status);
    if (token === "ready") return "ready";
    if (token === "pending") return "pending";
    if (token === "urgent") return "urgent";
    if (tokenInList(status, statusSynonyms.ready)) return "ready";
    if (tokenInList(status, statusSynonyms.pending)) return "pending";
    if (tokenInList(status, statusSynonyms.urgent)) return "urgent";
    return "unknown";
  };
  const normalizePriority = (priority) => {
    const token = normalizeToken(priority);
    if (token === "urgent") return "urgent";
    if (token === "normal") return "normal";
    if (tokenInList(priority, prioritySynonyms.urgent)) return "urgent";
    if (tokenInList(priority, prioritySynonyms.normal)) return "normal";
    return "unknown";
  };
  const getStatusLabel = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === "ready") return labels("statuses.ready");
    if (normalized === "pending") return labels("statuses.pending");
    if (normalized === "urgent") return labels("priorities.urgent");
    return status;
  };
  const getPriorityLabel = (priority) => {
    const normalized = normalizePriority(priority);
    if (normalized === "urgent") return labels("priorities.urgent");
    if (normalized === "normal") return labels("priorities.normal");
    return priority;
  };

  // Stats array
  const stats = [
    {
      title: statsLabels.total,
      value: reports.length,
      icon: FaFileAlt,
      iconClass: "text-(--ui-info)",
      bgClass: "bg-(--ui-info-bg)",
    },
    {
      title: statsLabels.ready,
      value: reports.filter((r) => normalizeStatus(r.status) === "ready").length,
      icon: FaCheckCircle,
      iconClass: "text-(--ui-success)",
      bgClass: "bg-(--ui-success-bg)",
    },
    {
      title: statsLabels.pending,
      value: reports.filter((r) => normalizeStatus(r.status) === "pending").length,
      icon: FaHourglassHalf,
      iconClass: "text-(--ui-warning)",
      bgClass: "bg-(--ui-warning-bg)",
    },
    {
      title: statsLabels.thisMonth,
      value: reports.filter((r) => new Date(r.date).getMonth() === new Date().getMonth()).length,
      icon: FaXRay,
      iconClass: "text-(--ui-info)",
      bgClass: "bg-(--ui-info-bg)",
    },
  ];

  // Actions placeholders
  const handleDownload = () => showSuccess(labels("toast.download"));
  const handleShare = () => showSuccess(labels("toast.share"));
  const handlePrint = () => showInfo(labels("toast.print"));

  // Filtered reports
  const filteredReports = reports.filter((report) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (report.title || "").toLowerCase().includes(q) ||
      (report.doctor || "").toLowerCase().includes(q) ||
      (report.type || "").toLowerCase().includes(q);
    const matchesType = filterType === "all" || report.type === filterType;
    const matchesStatus = filterStatus === "all" || normalizeStatus(report.status) === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // UI
  return (
    <div className="min-h-screen bg-(--ui-surface) text-(--ui-foreground) p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-(--ui-foreground)">{labels("title")}</h1>
        <p className="text-(--ui-muted-foreground) mt-2">{labels("subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} variant="interactive" size="sm">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bgClass}`}>
                <stat.icon className={`text-2xl ${stat.iconClass}`} />
              </div>
              <div>
                <p className="text-(--ui-muted-foreground) text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-(--ui-foreground)">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-8">
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
          <div className="relative">
            <FaFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-(--ui-muted-foreground)" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface) text-(--ui-foreground) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) appearance-none"
            >
              <option value="all">{labels("filters.allStatuses")}</option>
              <option value="ready">{labels("statuses.ready")}</option>
              <option value="pending">{labels("statuses.pending")}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <Card className="p-12 text-center">
          <FaFileAlt className="text-6xl text-(--ui-muted-foreground) mx-auto mb-4" />
          <p className="text-(--ui-muted-foreground) text-lg">{labels("emptyState")}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredReports.map((report) => (
            <Card key={report.id} variant="interactive" className="hover:bg-(--ui-surface-2)/40 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{report.typeIcon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-(--ui-foreground)">{report.title}</h3>
                    <p className="text-sm text-(--ui-muted-foreground)">{report.type}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs border font-bold drop-shadow-sm ${getStatusColor(report.status)}`}>
                    {getStatusLabel(report.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs border font-bold drop-shadow-sm ${getPriorityColor(report.priority)}`}>
                    {getPriorityLabel(report.priority)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm text-(--ui-muted-foreground)">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{labels("reportLabels.doctor")}</span>
                  <span>{report.doctor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{labels("reportLabels.facility")}</span>
                  <span>{report.facility}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{labels("reportLabels.date")}</span>
                  <span>{report.date} - {report.time}</span>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-(--ui-info-bg) rounded-lg p-4 mb-4 border border-(--ui-info-border)">
                <div className="flex items-start gap-2">
                  <span className="text-(--ui-info) font-bold text-sm">{labels("reportLabels.aiSummary")}</span>
                </div>
                <p className="text-sm text-(--ui-foreground) mt-2">{report.aiSummary}</p>
              </div>

              {/* Clinical Status */}
              <div className="notes-box mb-4">
                <div className="mb-1 font-bold">{labels("reportLabels.clinicalStatus")}</div>
                <div>{report.clinicalStatus}</div>
              </div>

              {/* Findings */}
              <div className="mb-4">
                <h4 className="font-bold text-(--ui-foreground) mb-2 text-sm">{labels("reportLabels.findings")}</h4>
                <div className="space-y-2">
                  {report.findings.map((finding, idx) => (
                    <div key={idx} className={`flex items-start gap-2 text-sm ${getFindingColor(finding.type)}`}>
                      <span className="font-bold">{getFindingIcon(finding.type)}</span>
                      <span>{finding.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {report.notes && (
                <div className="bg-(--ui-surface-2)/40 rounded-lg p-3 mb-4 border border-(--ui-border)">
                  <p className="text-sm font-medium text-(--ui-foreground) mb-1">{labels("reportLabels.notes")}</p>
                  <p className="text-sm text-(--ui-muted-foreground)">{report.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedReport(report);
                    setShowImageModal(true);
                  }}
                  size="sm"
                  className="flex items-center justify-center gap-2"
                >
                  <FaEye />
                  <span>{labels("actions.view")}</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageModal && selectedReport && (
        <div className="fixed inset-0 bg-(--color-neutral)/80 flex items-center justify-center z-50 p-4">
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto p-0">
            <div className="sticky top-0 bg-(--ui-surface) border-b border-(--ui-border) p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold text-(--ui-foreground)">{selectedReport.title}</h3>
                <p className="text-sm text-(--ui-muted-foreground)">{selectedReport.type} - {selectedReport.date}</p>
              </div>
              <button onClick={() => setShowImageModal(false)} className="p-2 hover:bg-(--ui-surface-2)/60 rounded-lg transition-colors">
                <FaTimes className="text-xl text-(--ui-muted-foreground)" />
              </button>
            </div>

            <div className="p-6">
              {/* AI Summary */}
              <div className="bg-(--ui-info-bg) border border-(--ui-info-border) rounded-lg p-4 mb-6">
                <h4 className="font-bold text-(--ui-info) mb-2">{labels("reportLabels.aiSummary")}</h4>
                <p className="text-(--ui-foreground)">{selectedReport.aiSummary}</p>
              </div>

              {/* Findings */}
              <div className="mb-6">
                <h4 className="font-bold text-(--ui-foreground) mb-3">{labels("reportLabels.findings")}</h4>
                <div className="space-y-2">
                  {selectedReport.findings.map((finding, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg bg-(--ui-surface-2)/40 border border-(--ui-border) ${getFindingColor(finding.type)}`}>
                      <span className="font-bold text-lg">{getFindingIcon(finding.type)}</span>
                      <span>{finding.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Images */}
              {selectedReport.images.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-(--ui-foreground) mb-3">{t("modal.medicalImages")}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square bg-(--ui-surface-2) border border-(--ui-border) rounded-lg overflow-hidden">
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
                          onError={(e) => { try { e.currentTarget.style.display = "none"; } catch {} }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor Info */}
              <div className="bg-(--ui-surface-2)/40 border border-(--ui-border) rounded-lg p-4">
                <h4 className="font-bold text-(--ui-foreground) mb-2">{t("modal.doctorInformation")}</h4>
                <div className="space-y-1 text-sm text-(--ui-muted-foreground)">
                  <p><span className="font-medium">{labels("reportLabels.doctor")}</span> {selectedReport.doctor}</p>
                  <p><span className="font-medium">{labels("reportLabels.facility")}</span> {selectedReport.facility}</p>
                  <p><span className="font-medium">{labels("reportLabels.date")}</span> {selectedReport.date} - {selectedReport.time}</p>
                  {selectedReport.notes && (
                    <p className="mt-2 pt-2 border-t border-(--ui-border)">
                      <span className="font-medium">{labels("reportLabels.notes")}:</span> {selectedReport.notes}
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

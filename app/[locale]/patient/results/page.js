// صفحة نتائج المريض: تعرض تقارير الأشعة الخاصة بالمريض بشكل تفاعلي
"use client";

// استيراد الأدوات اللازمة من React وNext.js والمكتبات المساعدة
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "../../../components/ui/ToastProvider";
import {
  FaFileAlt,
  FaXRay,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaShare,
  FaPrint,
  FaTimes,
  FaCheckCircle,
  FaHourglassHalf,
} from "react-icons/fa";
import { useLocale, useTranslations } from "next-intl";
import UnifiedCard from "../../../components/ui/UnifiedCard";

// المكون الرئيسي للصفحة
export default function PatientResultsPage() {
  const router = useRouter();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const locale = useLocale();
  const t = useTranslations("patientResults");

  // متغيرات الحالة (state) الخاصة بواجهة المستخدم:
  // - البحث
  // - الفلاتر
  // - عرض صورة التقرير
  // - التقرير المحدد
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const labels = t;

  // مصفوفة التقارير التي سيتم عرضها (تملأ من API)
  const [reports, setReports] = useState([]);

  // تحميل التقارير من API عند تحميل الصفحة
  useEffect(() => {
    // عند تحميل الصفحة أو تغيير اللغة، يتم جلب التقارير من الخادم
    Promise.resolve().then(async () => {
      try {
        const res = await fetch("/api/patient/results");
        if (!res.ok) return;
        const data = await res.json();

        // دالة لتحديد نوع الفحص من اسم الصورة
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

        // دالة لتنسيق التاريخ (YYYY-MM-DD)
        const formatDate = (dt) => {
          if (!dt) return "";
          const d = new Date(dt);
          if (Number.isNaN(d.getTime())) return "";
          return d.toISOString().slice(0, 10);
        };

        // دالة لتنسيق الوقت (ساعة ودقيقة)
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

        // معالجة بيانات التقارير وتحويلها لصيغة مناسبة للعرض
        const mapped = (data.records || [])
          .map((r) => {
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
            const confidence =
              typeof r.confidenceScore === "number" ? r.confidenceScore : null;

            const priority =
              ai === "POSITIVE" && (confidence == null || confidence >= 0.7)
                ? "urgent"
                : "normal";

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
              typeIcon:
                typeKey === "xray"
                  ? "🩻"
                  : typeKey === "ct"
                    ? "🔬"
                    : typeKey === "mri"
                      ? "🧲"
                      : typeKey === "ultrasound"
                        ? "📡"
                        : "📄",
              date: formatDate(r.createdAt),
              time: formatTime(r.createdAt),
              status,
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
              createdAt: r.createdAt, // keep original date for sorting
            };
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setReports(mapped); // حفظ النتائج في state
      } catch (err) {
        console.error("Failed to load patient results:", err);
      }
    });
  }, [t, locale]);
  // تسميات الإحصائيات (عدد التقارير، الجاهزة، المعلقة، تقارير هذا الشهر)
  const statsLabels = {
    total: t("stats.total"),
    ready: t("stats.ready"),
    pending: t("stats.pending"),
    thisMonth: t("stats.thisMonth"),
  };

  // مرادفات الحالات والأولوية (للتعامل مع تعدد اللغات أو القيم)
  const statusSynonyms = typeof t.raw === "function" ? t.raw("statusSynonyms") || {} : {};
  const prioritySynonyms = typeof t.raw === "function" ? t.raw("prioritySynonyms") || {} : {};

  // دوال مساعدة لتوحيد القيم (حالة التقرير، الأولوية)
  const normalizeToken = (value) => String(value ?? "").trim().toLowerCase();
  const tokenInList = (value, list) => {
    const token = normalizeToken(value);
    if (!token) return false;
    return Array.isArray(list) && list.some((x) => normalizeToken(x) === token);
  };

  const normalizeStatus = (status) => {
    const token = normalizeToken(status);
    // Always support canonical keys (API/UI internal)
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

  // دوال لإرجاع النص المناسب للحالة أو الأولوية حسب اللغة
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

  // مصفوفة الإحصائيات للعرض في واجهة المستخدم
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
      value: reports.filter((r) => normalizeStatus(r.status) === "ready")
        .length,
      icon: FaCheckCircle,
      iconClass: "text-(--ui-success)",
      bgClass: "bg-(--ui-success-bg)",
    },
    {
      title: statsLabels.pending,
      value: reports.filter((r) => normalizeStatus(r.status) === "pending")
        .length,
      icon: FaHourglassHalf,
      iconClass: "text-(--ui-warning)",
      bgClass: "bg-(--ui-warning-bg)",
    },
    {
      title: statsLabels.thisMonth,
      value: reports.filter(
        (r) => new Date(r.date).getMonth() === new Date().getMonth(),
      ).length,
      icon: FaXRay,
      iconClass: "text-(--ui-info)",
      bgClass: "bg-(--ui-info-bg)",
    },
  ];

  // دوال لإرجاع لون الحالة أو الأولوية أو النتيجة (للتصميم)
  const getStatusColor = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === "ready") {
      return "bg-green-600 text-white border-green-700 dark:bg-green-500 dark:text-white dark:border-green-300";
    } else if (normalized === "pending") {
      return "bg-yellow-400 text-black border-yellow-600 dark:bg-yellow-300 dark:text-black dark:border-yellow-500";
    } else if (normalized === "urgent") {
      return "bg-red-600 text-white border-red-700 dark:bg-red-500 dark:text-white dark:border-red-300";
    } else {
      return "bg-gray-200 text-gray-700 border-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-500";
    }
  };

  const getPriorityColor = (priority) => {
    const normalized = normalizePriority(priority);
    if (normalized === "urgent") {
      return "bg-red-600 text-white border-red-700 dark:bg-red-500 dark:text-white dark:border-red-300";
    } else if (normalized === "normal") {
      return "bg-blue-600 text-white border-blue-700 dark:bg-blue-500 dark:text-white dark:border-blue-300";
    } else {
      return "bg-gray-200 text-gray-700 border-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-500";
    }
  };

  const getFindingColor = (type) => {
    switch (type) {
      case "normal":
        return "text-(--ui-success)";
      case "warning":
        return "text-(--ui-warning)";
      case "info":
        return "text-(--ui-info)";
      default:
        return "text-(--ui-muted-foreground)";
    }
  };

  const getFindingIcon = (type) => {
    switch (type) {
      case "normal":
        return "✓";
      case "warning":
        return "⚠";
      case "info":
        return "ℹ";
      default:
        return "•";
    }
  };

  // دوال التعامل مع أزرار التحميل والمشاركة والطباعة
  const handleDownload = (reportId) => {
    showSuccess(labels("toast.download"));
  };

  const handleShare = (reportId) => {
    showSuccess(labels("toast.share"));
  };

  const handlePrint = (reportId) => {
    showInfo(labels("toast.print"));
  };

  // تصفية التقارير حسب البحث والفلاتر
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

  // واجهة المستخدم الرئيسية للصفحة (JSX)
  return (
    <>

      <div className="min-h-screen bg-(--ui-surface) text-(--ui-foreground) p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-(--ui-foreground)">
            {labels("title")}
          </h1>
          <p className="text-(--ui-muted-foreground) mt-2">
            {labels("subtitle")}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <UnifiedCard
              key={index}
              className="rounded-xl p-6 border border-(--ui-border)"
              glass
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bgClass}`}>
                  <stat.icon className={`text-2xl ${stat.iconClass}`} />
                </div>
                <div>
                  <p className="text-(--ui-muted-foreground) text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-(--ui-foreground)">{stat.value}</p>
                </div>
              </div>
            </UnifiedCard>
          ))}
        </div>

        {/* Filters */}
        <UnifiedCard className="rounded-xl p-6 mb-8 border border-(--ui-border)" glass>
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
        </UnifiedCard>

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <UnifiedCard className="rounded-xl p-12 text-center border border-(--ui-border)" glass>
            <FaFileAlt className="text-6xl text-(--ui-muted-foreground) mx-auto mb-4" />
            <p className="text-(--ui-muted-foreground) text-lg">{labels("emptyState")}</p>
          </UnifiedCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredReports.map((report) => (
              <UnifiedCard
                key={report.id}
                className="rounded-xl p-6 border border-(--ui-border) hover:bg-(--ui-surface-2)/40 transition-colors"
                glass
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{report.typeIcon}</div>
                    <div>
                      <h3 className="text-lg font-bold text-(--ui-foreground)">
                        {report.title}
                      </h3>
                      <p className="text-sm text-(--ui-muted-foreground)">
                        {report.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs border font-bold drop-shadow-sm ${getStatusColor(report.status)} border-2! border-black/20! dark:border-white/30!`}
                    >
                      {getStatusLabel(report.status)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs border font-bold drop-shadow-sm ${getPriorityColor(report.priority)} border-2! border-black/20! dark:border-white/30!`}
                    >
                      {getPriorityLabel(report.priority)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm text-(--ui-muted-foreground)">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {labels("reportLabels.doctor")}
                    </span>
                    <span>{report.doctor}</span>
                  </div>
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
                <div className="bg-(--ui-info-bg) rounded-lg p-4 mb-4 border border-(--ui-info-border)">
                  <div className="flex items-start gap-2">
                    <span className="text-(--ui-info) font-bold text-sm">
                      {labels("reportLabels.aiSummary")}:
                    </span>
                  </div>
                  <p className="text-sm text-(--ui-foreground) mt-2">
                    {report.aiSummary}
                  </p>
                </div>

                {/* Findings */}
                <div className="mb-4">
                  <h4 className="font-bold text-(--ui-foreground) mb-2 text-sm">
                    {labels("reportLabels.findings")}:
                  </h4>
                  <div className="space-y-2">
                    {report.findings.map((finding, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 text-sm ${getFindingColor(finding.type)}`}
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
                  <div className="bg-(--ui-surface-2)/40 rounded-lg p-3 mb-4 border border-(--ui-border)">
                    <p className="text-sm font-medium text-(--ui-foreground) mb-1">
                      {labels("reportLabels.notes")}:
                    </p>
                    <p className="text-sm text-(--ui-muted-foreground)">
                      {report.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setShowImageModal(true);
                    }}
                    className="flex-1 btn-gradient px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    <FaEye />
                    <span>{labels("actions.view")}</span>
                  </button>
                </div>
              </UnifiedCard>
            ))}
          </div>
        )}

        {/* Image Viewer Modal */}
        {showImageModal && selectedReport && (
          <div className="fixed inset-0 bg-(--color-neutral)/80 flex items-center justify-center z-50 p-4">
            <UnifiedCard className="rounded-xl border border-(--ui-border) max-w-4xl w-full max-h-[90vh] overflow-y-auto" glass>
              <div className="sticky top-0 bg-(--ui-surface) border-b border-(--ui-border) p-6 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-xl font-bold text-(--ui-foreground)">
                    {selectedReport.title}
                  </h3>
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {selectedReport.type} - {selectedReport.date}
                  </p>
                </div>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="p-2 hover:bg-(--ui-surface-2)/60 rounded-lg transition-colors"
                >
                  <FaTimes className="text-xl text-(--ui-muted-foreground)" />
                </button>
              </div>

              <div className="p-6">
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
                    {labels("reportLabels.findings")}:
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
                              // Hide broken images so the fallback icon shows.
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
            </UnifiedCard>
          </div>
        )}
      </div>
    </>
  );
}

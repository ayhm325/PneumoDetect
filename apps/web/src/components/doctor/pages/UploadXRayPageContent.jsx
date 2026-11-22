"use client";
import React, { useCallback, useEffect, useState } from "react";
import FileUpload from "../../ui/FileUpload";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import {
  Alert,
  Button,
  Card,
  Input,
  Loader,
  Modal,
  Skeleton,
  Toast,
} from "@/components/ui";
import { ContentPageLayout } from "@/components/layouts";

export default function UploadXRayPageContent() {
  const t = useTranslations("uploadXray");
  const locale = useLocale();
  const ui = useTranslations("ui");

  const placeholder = ui("placeholder");

  const [recentUploads, setRecentUploads] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  const loadRecentUploads = useCallback(async () => {
    try {
      const res = await fetch("/api/analysis/history?scope=doctor", { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : [];
      setRecentUploads(
        rows.slice(0, 10).map((item) => ({
          id: item.id,
          patientName: item.patientName || item.prediction || placeholder,
          type: "xray",
          date: item.createdAt ? new Date(item.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-US") : placeholder,
          status: item.reviewStatus || (item.reviewedByDoctor ? "reviewed" : item.needsReview ? "requires_review" : "pending_review"),
          notes: item.uploadNotes
            ? `${item.prediction || ""} (${Math.round(Number(item.confidence || 0) * 100)}%) — ${item.uploadNotes}`
            : item.prediction
              ? `${item.prediction} (${Math.round(Number(item.confidence || 0) * 100)}%)`
              : placeholder,
        })),
      );
    } catch {
      // Keep existing list on network error
    }
  }, [locale, placeholder]);

  useEffect(() => {
    loadRecentUploads();
  }, [loadRecentUploads]);

  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [perFileOutcomes, setPerFileOutcomes] = useState([]);
  const [toast, setToast] = useState({ open: false, message: "", variant: "info" });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/doctor/patients", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data?.patients) ? data.patients : [];
        setPatients(list);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setPatientsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredPatients = patients.filter((p) => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return true;
    const name = String(p.fullName || p.user?.fullName || "").toLowerCase();
    const email = String(p.email || p.user?.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  // رفع الملفات عبر FileUpload الموحد (PNG/JPG/WEBP فقط)
  const handleFileUpload = (selectedFiles) => {
    const incoming = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles];
    const allowed = new Set(["image/png", "image/jpeg", "image/webp"]);
    const valid = incoming.filter((f) => {
      const mime = String(f.type || "").toLowerCase();
      const name = String(f.name || "").toLowerCase();
      return allowed.has(mime) || /\.(png|jpe?g|webp)$/.test(name);
    });
    if (valid.length < incoming.length) {
      setToast({
        open: true,
        message:
          locale === "ar"
            ? "يدعم النموذج صور الأشعة السينية بصيغة PNG وJPG وWEBP فقط."
            : "Only chest X-ray images (PNG, JPG, JPEG, WEBP) are supported.",
        variant: "error",
      });
    }
    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadSingleFile = (file) =>
    new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("with_heatmap", "true");
      formData.append("patientId", selectedPatientId);
      formData.append("modality", "xray");
      if (notes) formData.append("notes", notes);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/analysis/analyze");
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          setProgress(pct);
          if (pct >= 100) {
            setPhase("analyzing");
          }
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new Error(data?.message || data?.error || `HTTP ${xhr.status}`));
          }
        } catch {
          reject(new Error(`HTTP ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(formData);
    });

  const handleUpload = async () => {
    if (!selectedPatientId || files.length === 0) {
      setToast({
        open: true,
        message: t("toast.selectPatient"),
        variant: "error",
      });
      return;
    }
    setUploading(true);
    setPhase("uploading");
    setProgress(0);
    setPerFileOutcomes([]);
    try {
      let latest = null;
      const outcomes = [];
      for (const file of files) {
        setPhase("uploading");
        setProgress(0);
        try {
          const res = await uploadSingleFile(file);
          latest = res;
          outcomes.push({
            fileName: file.name,
            ok: true,
            prediction: res?.prediction || res?.data?.prediction,
            confidence: res?.confidence ?? res?.data?.confidence,
            isMock: Boolean(res?.is_mock || res?.data?.isMock),
          });
        } catch (fileErr) {
          outcomes.push({
            fileName: file.name,
            ok: false,
            error: fileErr?.message || "Upload failed",
          });
        }
      }
      setPerFileOutcomes(outcomes);
      setLastResult(latest);
      if (outcomes.some((o) => o.ok)) {
        const hasMockOnly = outcomes.filter((o) => o.ok).every((o) => o.isMock);
        if (hasMockOnly) {
          setToast({
            open: true,
            message:
              locale === "ar"
                ? "تم تشغيل وضع المحاكاة فقط — لم يتم حفظ النتيجة في السجل الطبي."
                : "Simulation mode only — result was NOT saved to the medical record.",
            variant: "warning",
          });
        } else {
          setShowSuccessModal(true);
          setToast({
            open: true,
            message: t("upload"),
            variant: "success",
          });
          setFiles([]);
          setNotes("");
          await loadRecentUploads();
        }
      } else {
        setToast({
          open: true,
          message: outcomes[0]?.error || "Upload failed",
          variant: "error",
        });
      }
      setProgress(0);
      setPhase("idle");
    } catch (err) {
      setToast({
        open: true,
        message: err?.message || "Upload failed",
        variant: "error",
      });
    } finally {
      setUploading(false);
      setPhase("idle");
    }
  };

  return (
    <>
      <ContentPageLayout
        title={t("upload")}
        subtitle={
          locale === "ar"
            ? "أشعة الصدر السينية فقط (PNG, JPG, JPEG, WEBP) — مرتبطة بسجل المريض المعين"
            : "Chest X-Ray only (PNG, JPG, JPEG, WEBP) — linked to an assigned patient record"
        }
        actions={
          uploading ? (
            <Loader
              label={
                phase === "analyzing"
                  ? locale === "ar"
                    ? "جارٍ التحليل بالذكاء الاصطناعي..."
                    : "Running AI screening..."
                  : `${t("uploading")} ${Math.round(progress)}%`
              }
              size="sm"
            />
          ) : null
        }
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="space-y-4 lg:col-span-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--ui-foreground)]">
                {t("patientNameLabel")}
              </label>
              <Input
                placeholder={
                  locale === "ar" ? "ابحث في قائمة مرضاك المعينين..." : "Search your assigned patients..."
                }
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                disabled={patientsLoading}
                className="ui-native-select ui-future-panel h-11 w-full rounded-xl border border-[var(--ui-border)] px-3 text-sm text-[var(--ui-foreground)] outline-none focus-visible:border-[var(--ui-border-strong)]"
              >
                <option value="">
                  {patientsLoading
                    ? locale === "ar"
                      ? "جارٍ تحميل المرضى..."
                      : "Loading assigned patients..."
                    : locale === "ar"
                      ? "اختر المريض المعين"
                      : "Select an assigned patient"}
                </option>
                {filteredPatients.map((p) => {
                  const name = p.fullName || p.user?.fullName || p.email || p.user?.email || p.id;
                  return (
                    <option key={p.id} value={p.id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)]/50 px-3.5 py-2.5 text-xs font-medium text-[var(--ui-muted)]">
              {locale === "ar"
                ? "النوع المدعوم: أشعة الصدر السينية (Chest X-Ray) — صيغ PNG وJPG وWEBP فقط."
                : "Supported Modality: Chest X-Ray (DenseNet121) — PNG, JPG, JPEG, WEBP only."}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--ui-foreground)]">{t("notesLabel")}</label>
              <textarea
                placeholder={t("notesPlaceholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="ui-future-panel min-h-[110px] w-full rounded-xl border border-[var(--ui-border)] px-3 py-2 text-sm text-[var(--ui-foreground)] outline-none placeholder:text-[var(--ui-muted)] focus-visible:border-[var(--ui-border-strong)]"
              />
            </div>

            <FileUpload
              onUpload={handleFileUpload}
              accept="image/png,image/jpeg,image/webp"
              multiple
              label={t("selectFiles")}
              className="ui-future-panel rounded-2xl border border-dashed border-[var(--ui-border-strong)] p-8 text-center"
            >
              <div className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full ui-future-chip">📁</div>
                <p className="text-sm font-medium text-[var(--ui-foreground)]">
                  {t("dragDrop")} {t("orText")} {t("selectFiles")}
                </p>
                <p className="text-xs text-[var(--ui-muted)]">PNG, JPG, JPEG, WEBP (Max 10MB)</p>
              </div>
            </FileUpload>

            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedPatientId || files.length === 0}
              isLoading={uploading}
            >
              {uploading
                ? phase === "analyzing"
                  ? locale === "ar"
                    ? "جارٍ التحليل..."
                    : "Analyzing..."
                  : `${t("uploading")} ${Math.round(progress)}%`
                : t("upload")}
            </Button>

            {perFileOutcomes.length > 0 && (
              <div className="space-y-2 pt-2">
                {perFileOutcomes.map((o, idx) => (
                  <div
                    key={`${o.fileName}-${idx}`}
                    className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                      o.ok
                        ? "border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-foreground)]"
                        : "border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] text-[var(--ui-danger)]"
                    }`}
                  >
                    <span className="font-bold">{o.fileName}: </span>
                    {o.ok
                      ? `${o.prediction || "OK"} (${Math.round(Number(o.confidence || 0) * 100)}%)${
                          o.isMock ? " [SIMULATED MOCK]" : ""
                        }`
                      : o.error}
                  </div>
                ))}
              </div>
            )}

            {uploading ? (
              <progress
                value={progress}
                max={100}
                className="h-2 w-full overflow-hidden rounded-full bg-[var(--ui-surface-2)] [&::-webkit-progress-bar]:bg-[var(--ui-surface-2)] [&::-webkit-progress-value]:bg-[var(--ui-info)] [&::-moz-progress-bar]:bg-[var(--ui-info)]"
              />
            ) : null}
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--ui-foreground)]">{t("selectedFilesLabel")}</h2>
            {files.length === 0 ? (
              <Alert variant="info">{t("selectFiles")}</Alert>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="ui-future-chip flex items-center justify-between gap-2 rounded-xl border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ui-foreground)]">{file.name}</p>
                      <p className="text-xs text-[var(--ui-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--ui-danger)] hover:bg-[var(--ui-danger-bg)]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--ui-foreground)]">{t("recentUploadsTitle")}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--ui-border)]">
                <tr>
                  <th className="px-4 py-2 text-start font-semibold text-[var(--ui-muted)]">{t("patientNameLabel")}</th>
                  <th className="px-4 py-2 text-start font-semibold text-[var(--ui-muted)]">{t("imageTypeLabel")}</th>
                  <th className="px-4 py-2 text-start font-semibold text-[var(--ui-muted)]">{t("dateLabel")}</th>
                  <th className="px-4 py-2 text-start font-semibold text-[var(--ui-muted)]">{t("statusLabel")}</th>
                  <th className="px-4 py-2 text-start font-semibold text-[var(--ui-muted)]">{t("notesLabel")}</th>
                </tr>
              </thead>
              <tbody>
                {uploading
                  ? [0, 1, 2].map((row) => (
                      <tr key={`skeleton-${row}`} className="border-b border-[var(--ui-border)]">
                        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                      </tr>
                    ))
                  : recentUploads.map((upload) => (
                      <tr key={upload.id} className="border-b border-[var(--ui-border)] hover:bg-[var(--ui-surface-2)]/60">
                        <td className="px-4 py-3 text-[var(--ui-foreground)]">{upload.patientName}</td>
                        <td className="px-4 py-3 text-[var(--ui-muted)]">{t(`types.${upload.type}`)}</td>
                        <td className="px-4 py-3 text-[var(--ui-muted)]">{upload.date}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${upload.status === "completed" ? "bg-[var(--ui-success-bg)] text-[var(--ui-foreground)]" : "bg-[var(--ui-warning-bg)] text-[var(--ui-warning-foreground)]"}`}
                          >
                            {upload.status === "completed" ? t("statuses.completed") : t("statuses.reviewing")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--ui-muted)]">{upload.notes}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </Card>
      </ContentPageLayout>

      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title={t("uploading")}>
        <div className="space-y-4">
          <Alert variant="success">
            {t("upload")}
            {lastResult?.prediction ? ` — ${lastResult.prediction} (${Math.round(Number(lastResult.confidence || 0) * 100)}%)` : ""}
          </Alert>
          <div className="flex justify-end">
            <Button variant="secondary" className="w-auto px-6" onClick={() => setShowSuccessModal(false)}>
              OK
            </Button>
          </div>
        </div>
      </Modal>

      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
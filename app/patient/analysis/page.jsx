"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import AnalysisDetailsModal from "../../components/analysis/AnalysisDetailsModal";
import { useTranslations } from "next-intl";

// شريط الثقة مع تدرج ولون متغير حسب النسبة
function ConfidenceBar({ confidence = 0, label, labelTitle }) {
  const pct = Math.round(Number(confidence) * 100 || 0);

  const progressTone =
    pct >= 75
      ? "[&::-webkit-progress-value]:bg-(--ui-success) [&::-moz-progress-bar]:bg-(--ui-success)"
      : pct >= 50
        ? "[&::-webkit-progress-value]:bg-(--ui-warning) [&::-moz-progress-bar]:bg-(--ui-warning)"
        : "[&::-webkit-progress-value]:bg-(--ui-danger) [&::-moz-progress-bar]:bg-(--ui-danger)";

  return (
    <div>
      <progress
        value={pct}
        max={100}
        className={`h-4 w-full overflow-hidden rounded-full border border-(--ui-border) bg-(--ui-surface-2)/40 shadow-inner [&::-webkit-progress-bar]:bg-(--ui-surface-2)/40 [&::-webkit-progress-value]:rounded-full ${progressTone}`}
      />
      <div className="mt-2 flex items-center justify-between text-sm text-(--ui-muted-foreground)">
        <span className="font-medium text-(--ui-foreground)">{pct}%</span>
        <span className="text-(--ui-muted-foreground)" title={labelTitle}>
          {label}
        </span>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const t = useTranslations("patient");

  // ----------------------- حالات React -----------------------
  const [selectedImage, setSelectedImage] = useState(null); // الصورة المختارة
  const [previewUrl, setPreviewUrl] = useState(null);       // رابط معاينة الصورة
  const [isLoading, setIsLoading] = useState(false);        // حالة التحليل جاري
  const [analysisResult, setAnalysisResult] = useState(null); // نتيجة التحليل
  const [savedToHistory, setSavedToHistory] = useState(false); // حفظ التاريخ
  const [showModal, setShowModal] = useState(false);        // عرض مودال التفاصيل
  const [error, setError] = useState(null);                // رسالة الخطأ
  const [uploadProgress, setUploadProgress] = useState(null); // تقدم التحميل
  const [uploadLoaded, setUploadLoaded] = useState(null); // حجم تم تحميله
  const [uploadTotal, setUploadTotal] = useState(null);   // الحجم الكلي للملف
  const [uploadStartTime, setUploadStartTime] = useState(null); // توقيت بدء التحميل
  const [resultsVisible, setResultsVisible] = useState(false); // ظهور نتائج التحليل

  const xhrRef = useRef(null);       // مرجع XMLHttpRequest للتحكم بالتحميل
  const fileInputRef = useRef(null); // مرجع input لاختيار الصورة

  // ----------------------- وظائف مساعدة -----------------------
  // إعادة تعيين حالة واجهة التحميل
  const resetUploadUi = () => {
    setIsLoading(false);
    setUploadProgress(null);
    setUploadLoaded(null);
    setUploadTotal(null);
    setUploadStartTime(null);
  };

  // تنسيق الحجم بالميغا بايت
  const formatMB = (bytes) => (bytes ? (bytes / 1024 / 1024).toFixed(2) : "0.00");

  // حساب الوقت المتبقي للتحميل
  const formatEta = () => {
    if (!uploadLoaded || !uploadTotal || !uploadStartTime) return null;
    const now = Date.now();
    const elapsedMs = Math.max(1, now - uploadStartTime);
    const speedBps = uploadLoaded / (elapsedMs / 1000);
    if (!speedBps || speedBps <= 0) return null;
    const remaining = Math.max(0, uploadTotal - uploadLoaded);
    const etaSec = remaining / speedBps;
    const minutes = Math.floor(etaSec / 60);
    const seconds = Math.floor(etaSec % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // ----------------------- اختيار وإزالة الصورة -----------------------
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
      resetUploadUi();
    }

    setSelectedImage(file);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleRemoveImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(null);
    setPreviewUrl(null);
    setError(null);
    if (xhrRef.current) xhrRef.current.abort();
    xhrRef.current = null;
    resetUploadUi();
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) xhrRef.current.abort();
    xhrRef.current = null;
    resetUploadUi();
    setError(t("analysis.errors.uploadCanceled"));
  };

  // ----------------------- إلغاء التحميل عند الانتقال بين الصفحات -----------------------
  useEffect(() => {
    const abortUpload = () => {
      if (xhrRef.current) xhrRef.current.abort();
      xhrRef.current = null;
    };

    window.addEventListener("beforeunload", abortUpload);
    window.addEventListener("pagehide", abortUpload);
    window.addEventListener("popstate", abortUpload);

    const origPush = history.pushState;
    const origReplace = history.replaceState;

    // كشف التنقل داخل SPA
    history.pushState = function (...args) {
      const res = origPush.apply(this, args);
      window.dispatchEvent(new Event("navigation"));
      return res;
    };
    history.replaceState = function (...args) {
      const res = origReplace.apply(this, args);
      window.dispatchEvent(new Event("navigation"));
      return res;
    };
    window.addEventListener("navigation", abortUpload);

    return () => {
      window.removeEventListener("beforeunload", abortUpload);
      window.removeEventListener("pagehide", abortUpload);
      window.removeEventListener("popstate", abortUpload);
      window.removeEventListener("navigation", abortUpload);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);

  // ----------------------- عرض نتائج التحليل مع تأثير الدخول -----------------------
  useEffect(() => {
    if (analysisResult) {
      const id = setTimeout(() => setResultsVisible(true), 40);
      return () => clearTimeout(id);
    }
    setResultsVisible(false);
  }, [analysisResult]);

  // ----------------------- رفع الصورة وتحليلها -----------------------
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", selectedImage);
    formData.append("with_heatmap", "true");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      setUploadProgress(0);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("POST", "/api/analysis/analyze");
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const now = Date.now();
          if (!uploadStartTime) setUploadStartTime(now);
          setUploadLoaded(e.loaded);
          setUploadTotal(e.total);
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        setIsLoading(false);
        resetUploadUi();

        try {
          const data = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300) {
            setAnalysisResult(data.data ?? null);
            setSavedToHistory(Boolean(data.saved));
          } else {
            setError(data.error || data.message || `HTTP ${xhr.status}`);
          }
        } catch (e) {
          setError(String(e));
        }
      };

      xhr.onerror = () => {
        setIsLoading(false);
        resetUploadUi();
        setError(t("analysis.errors.networkUpload"));
      };

      xhr.send(formData);
    } catch (err) {
      setError(err.message || String(err));
      setIsLoading(false);
      resetUploadUi();
    }
  };

  // ----------------------- واجهة المستخدم -----------------------
  return (
    <div className="min-h-[85vh] py-14 bg-(--ui-surface) text-(--ui-foreground)">
      <div className="max-w-7xl mx-auto p-8 card-glass rounded-3xl">
        {/* عنوان الصفحة */}
        <header className="flex items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight brand-gradient-text">
              {t("analysis.title")}
            </h1>
            <p className="mt-2 text-base text-(--ui-muted-foreground)">
              {t("analysis.subtitle")}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-(--ui-surface-2)/40 shadow-sm border border-(--ui-border)">
              <span className="text-sm text-(--ui-muted-foreground)">
                {t("analysis.badge")}
              </span>
            </div>
          </div>
        </header>

        {/* أزرار اختيار الصورة وإزالتها */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/tiff"
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-3 px-5 py-3 rounded-xl btn-gradient text-lg font-semibold shadow-xl hover:scale-105 transition-transform"
          >
            📁 {t("analysis.controls.chooseImage")}
          </button>
          {previewUrl && (
            <button
              onClick={handleRemoveImage}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--ui-danger) text-(--ui-danger-foreground) hover:opacity-90 shadow-lg text-lg"
            >
              ✖ {t("analysis.controls.remove")}
            </button>
          )}
        </div>

        {/* تخطيط الصفحة: معاينة الصورة ونتائج التحليل */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* معاينة الصورة والتحميل */}
          <div>
            <div className="rounded-3xl overflow-hidden card-glass transition-transform duration-300 hover:scale-[1.01]">
              <div className="p-4">
                {previewUrl ? (
                  <div className="relative w-full pb-[75%] transition-transform duration-300 hover:scale-105">
                    <Image
                      src={previewUrl}
                      alt={t("analysis.preview.alt")}
                      fill
                      className="object-cover absolute inset-0 rounded-xl"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-full h-60 flex items-center justify-center bg-(--ui-surface-2)/40 text-(--ui-muted-foreground)">
                    {t("analysis.preview.noneSelected")}
                  </div>
                )}
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="text-base text-(--ui-muted-foreground) truncate">
                  {selectedImage ? selectedImage.name : t("analysis.preview.noFile")}
                </div>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isLoading}
              className={`mt-5 w-full py-4 rounded-3xl text-white text-xl font-bold transition-transform shadow-xl ${
                isLoading
                  ? "bg-(--ui-muted-2) text-(--ui-foreground) opacity-70 cursor-not-allowed"
                  : "btn-gradient hover:scale-105"
              }`}
            >
              {isLoading ? t("analysis.actions.analyzing") : t("analysis.actions.analyze")}
            </button>

            {/* شريط التقدم عند التحميل */}
            {uploadProgress !== null && (
              <div className="mt-4">
                <div className="relative w-full h-10 rounded-2xl overflow-hidden border border-(--ui-border) bg-(--ui-surface-2)/40">
                  <progress
                    value={uploadProgress}
                    max={100}
                    className="absolute inset-0 h-full w-full appearance-none [&::-webkit-progress-bar]:bg-(--ui-surface-2)/40 [&::-webkit-progress-value]:bg-linear-to-r [&::-webkit-progress-value]:from-(--ui-success) [&::-webkit-progress-value]:via-(--ui-warning) [&::-webkit-progress-value]:to-(--ui-danger) [&::-moz-progress-bar]:bg-(--ui-success)"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-(--ui-foreground) drop-shadow-sm">
                    {uploadProgress}% • {formatMB(uploadLoaded)} MB / {formatMB(uploadTotal)} MB{" "}
                    {formatEta() && `• ${t("analysis.progress.etaLabel")}: ${formatEta()}`}
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <button onClick={handleCancelUpload} className="text-xs text-(--ui-danger) underline">
                    {t("analysis.actions.cancelUpload")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* نتائج التحليل */}
          <div className={`space-y-4 transition-all duration-700 ease-out transform ${resultsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
            {/* Heatmap */}
            {analysisResult && (analysisResult.heatmap_url || analysisResult.heatmapUrl) && (
              <div className="mb-2">
                <h3 className="text-md font-semibold mb-2">{t("analysis.results.heatmap")}</h3>
                <div className="rounded-3xl overflow-hidden card-glass shadow-sm p-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="block w-full border-0 bg-transparent p-0"
                  >
                    <div className="relative pb-[75%]">
                      <Image
                        src={analysisResult.heatmap_url ?? analysisResult.heatmapUrl}
                        alt={t("analysis.results.heatmap")}
                        fill
                        className="object-cover rounded-xl absolute inset-0"
                        unoptimized
                      />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* رسالة الخطأ */}
            {error && <p className="text-(--ui-danger) font-medium">{error}</p>}

            {/* بيانات التحليل */}
            {analysisResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* تشخيص */}
                <div className={`p-6 rounded-3xl shadow-xl hover:scale-102 hover:shadow-2xl transition-transform duration-300 ${
                  analysisResult?.needs_review
                    ? "bg-(--ui-warning-bg) border border-(--ui-warning-border)"
                    : String(analysisResult.prediction).toLowerCase().includes("normal")
                      ? "bg-green-600 border-green-700 text-white font-bold"
                      : String(analysisResult.prediction).toLowerCase().includes("pneumonia")
                        ? "bg-red-600 border-red-700 text-white font-bold"
                        : "bg-(--ui-danger-bg) border border-(--ui-danger-border) font-bold"
                }`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold mb-3 text-white">{t("analysis.results.diagnosis")}</h2>
                    {analysisResult?.needs_review && (
                      <span className="ml-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-(--ui-warning-bg) text-(--ui-foreground) text-sm font-semibold border border-(--ui-warning-border)">
                        ⚠ {t("analysis.results.needsReview")}
                      </span>
                    )}
                  </div>
                  <p className={`text-white text-center font-bold ${
                    String(analysisResult.prediction).toLowerCase().includes("normal") ||
                    String(analysisResult.prediction).toLowerCase().includes("pneumonia")
                      ? "text-3xl"
                      : "text-lg"
                  }`}>
                    {analysisResult.display_label ?? analysisResult.prediction}
                  </p>
                  {savedToHistory && (
                    <p className="text-white mt-3 font-bold text-center">
                      {t("analysis.results.savedToHistory")}
                    </p>
                  )}
                </div>

                {/* شريط الثقة والتفسير */}
                <div className="p-6 rounded-3xl shadow-xl card-glass hover:scale-102 transition-transform duration-300">
                  <h2 className="text-2xl font-semibold mb-3 text-(--ui-foreground)">
                    {t("analysis.results.confidence")}
                  </h2>
                  <ConfidenceBar
                    confidence={analysisResult.confidence}
                    label={t("analysis.results.confidence")}
                    labelTitle={t("analysis.results.confidenceTitle")}
                  />
                  {analysisResult.explanation && (
                    <p className="mt-4 text-(--ui-muted-foreground) text-sm">
                      <strong>{t("analysis.results.explanationLabel")}:</strong> {analysisResult.explanation}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* حالة عدم وجود Heatmap */}
            {analysisResult && !(analysisResult.heatmap_url || analysisResult.heatmapUrl) && (
              <div className="mt-2">
                <h1 className="text-md font-semibold mb-2">{t("analysis.results.heatmap")}</h1>
                <div className="w-full h-72 rounded-3xl border border-dashed border-(--ui-border) flex items-center justify-center bg-(--ui-surface-2)/40">
                  <span className="text-(--ui-muted-foreground) text-lg">{t("analysis.results.noHeatmap")}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* مودال التفاصيل */}
        {showModal && (
          <AnalysisDetailsModal
            record={analysisResult}
            saved={savedToHistory}
            saveError={analysisResult?.saveError}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest, resolveApiUrl } from "@/lib/apiClient";

interface AnalysisResponse {
  success?: boolean;
  data?: {
    id?: string;
    prediction?: string;
    confidence?: number;
    probabilities?: Record<string, number>;
    heatmapUrl?: string;
    heatmap_url?: string;
    imageUrl?: string;
    inferenceTimeMs?: number;
  };
  prediction?: string;
  confidence?: number;
  heatmap_url?: string;
}

export function AnalysisPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [withHeatmap, setWithHeatmap] = useState(true);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error(isAr ? "يرجى اختيار صورة أشعة" : "Please select an X-ray image");
      const formData = new FormData();
      formData.append("image", file);
      formData.append("with_heatmap", String(withHeatmap));
      return apiRequest<AnalysisResponse>("/api/analysis/analyze", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analysis", "history"] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  };

  const result = mutation.data?.data || mutation.data;
  const heatmap =
    (result as AnalysisResponse["data"])?.heatmapUrl ||
    (result as AnalysisResponse["data"])?.heatmap_url;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-bold">
          {isAr ? "تحليل الأشعة السينية للصدر" : "Chest X-Ray AI Analysis"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isAr
            ? "ارفع صورة أشعة الصدر للحصول على التنبؤ الطبي والخريطة الحرارية."
            : "Upload a chest X-ray image to run DenseNet121 pneumonia screening."}
        </p>

        <div className="mt-5 space-y-4">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="block w-full rounded-xl border border-slate-300 p-2.5 text-sm dark:border-slate-700"
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={withHeatmap}
              onChange={(e) => setWithHeatmap(e.target.checked)}
            />
            <span>{isAr ? "توليد خريطة حرارية (Grad-CAM)" : "Generate Grad-CAM Heatmap"}</span>
          </label>

          <button
            type="button"
            disabled={!file || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {mutation.isPending
              ? isAr
                ? "جاري التحليل..."
                : "Analyzing..."
              : isAr
                ? "بدء التحليل"
                : "Analyze X-Ray"}
          </button>

          {mutation.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {(mutation.error as Error).message}
            </div>
          )}
        </div>
      </div>

      {(preview || result) && (
        <div className="grid gap-6 md:grid-cols-2">
          {preview && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-bold">{isAr ? "الصورة الأصلية" : "Original X-Ray"}</h2>
              <img src={preview} alt="Original X-Ray" className="max-h-80 w-full rounded-xl object-contain" />
            </div>
          )}

          {result && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold">{isAr ? "نتيجة التحليل" : "Analysis Result"}</h2>
              <div className="mt-3 space-y-2 text-sm">
                <p>
                  <span className="font-semibold">{isAr ? "التشخيص:" : "Prediction:"}</span>{" "}
                  <span className="rounded-lg bg-sky-100 px-2.5 py-0.5 font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                    {result.prediction}
                  </span>
                </p>
                {typeof result.confidence === "number" && (
                  <p>
                    <span className="font-semibold">{isAr ? "نسبة الثقة:" : "Confidence:"}</span>{" "}
                    {(result.confidence * 100).toFixed(2)}%
                  </p>
                )}
              </div>

              {heatmap && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold text-slate-500">
                    {isAr ? "الخريطة الحرارية" : "Grad-CAM Heatmap"}
                  </p>
                  <img
                    src={resolveApiUrl(heatmap)}
                    alt="Analysis Heatmap"
                    className="max-h-72 w-full rounded-xl object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

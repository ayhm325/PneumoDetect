import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest, resolveApiUrl } from "@/lib/apiClient";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";

interface HistoryItem {
  id: string;
  prediction: string;
  confidence?: number | null;
  imageUrl?: string | null;
  heatmapUrl?: string | null;
  createdAt: string;
}

export function AnalysisHistoryPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["analysis", "history"],
    queryFn: () => apiRequest<{ success: boolean; data: HistoryItem[] }>("/api/analysis/history"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/analysis/history?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analysis", "history"] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const items = data?.data || [];
  if (items.length === 0) {
    return (
      <EmptyState
        title={isAr ? "لا يوجد سجل تحليلات بعد" : "No analysis history yet"}
        description={isAr ? "ستظهر هنا نتائج تحليلات الأشعة السينية." : "Your chest X-ray analyses will appear here."}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{isAr ? "سجل التحليلات" : "Analysis History"}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-sky-700 dark:text-sky-400">{item.prediction}</p>
                {typeof item.confidence === "number" && (
                  <p className="text-xs text-slate-500">
                    {isAr ? "الثقة:" : "Confidence:"} {(item.confidence * 100).toFixed(1)}%
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(item.id)}
                className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                {isAr ? "حذف" : "Delete"}
              </button>
            </div>
            {(item.heatmapUrl || item.imageUrl) && (
              <img
                src={resolveApiUrl(item.heatmapUrl || item.imageUrl || "")}
                alt="X-ray scan"
                className="mt-3 max-h-48 w-full rounded-xl object-contain"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

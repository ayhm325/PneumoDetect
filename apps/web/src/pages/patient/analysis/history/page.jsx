"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import AnalysisDetailsModal from "@/components/analysis/AnalysisDetailsModal";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import { formatDateTime } from "@/lib/date";
import { formatArabicDate } from "@/lib/arabicMonths";

export default function PatientAnalysisHistoryPage() {
  const locale = useLocale();
  const t = useTranslations("patient");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/analysis/history", {
          method: "GET",
          headers,
          credentials: "same-origin",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(body.error || body.message || `HTTP ${res.status}`);
        setRecords(body.data || []);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 text-(--ui-foreground)">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">
            {t("analysisHistory.title")}
          </h1>
          <p className="text-sm text-(--ui-muted-foreground) mt-1">
            {t("analysisHistory.subtitle")}
          </p>
        </div>
        {/* Refresh button removed as requested */}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-(--ui-danger-bg) border border-(--ui-danger-border) text-(--ui-danger) rounded">
          {error}
        </div>
      )}

      {/* Grid of cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse p-4 card-glass rounded-xl shadow-sm"
            >
              <div className="h-40 bg-(--ui-surface-2)/60 rounded-lg mb-4"></div>
              <div className="h-4 bg-(--ui-surface-2)/60 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-(--ui-surface-2)/60 rounded w-1/2 mb-4"></div>
              <div className="flex items-center justify-between">
                <div className="h-8 bg-(--ui-surface-2)/60 rounded w-24"></div>
                <div className="h-8 bg-(--ui-surface-2)/60 rounded w-20"></div>
              </div>
            </div>
          ))
        ) : records.length === 0 ? (
          <div className="col-span-full p-8 card-glass rounded-xl shadow-sm text-center">
            <p className="text-lg font-medium">
              {t("analysisHistory.emptyTitle")}
            </p>
            <p className="text-sm text-(--ui-muted-foreground) mt-2">
              {t("analysisHistory.emptySubtitle")}
            </p>
          </div>
        ) : (
          records.map((item) => (
            <article
              key={item.id}
              className="card-glass rounded-2xl shadow hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="relative h-44 bg-(--ui-surface-2)/40">
                <Image
                  src={item.imageUrl || item.image_url || "/icons/xray.svg"}
                  alt={item.prediction || t("analysisHistory.imageAltFallback")}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover rounded-t-2xl"
                />
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold truncate">
                      {item.prediction || item.prediction_label || placeholder}
                    </h3>
                    <div className="text-xs text-(--ui-muted-foreground) mt-1">
                      {locale === "ar"
                        ? (() => {
                            const d = new Date(
                              item.createdAt || item.created_at,
                            );
                            // Format: day month yearØŒ Ø§Ù„Ø³Ø§Ø¹Ø© hh:mm Øµ/Ù…
                            const month = require("../../../lib/arabicMonths")
                              .default[d.getMonth()];
                            const day = d.getDate();
                            const year = d.getFullYear();
                            let hour = d.getHours();
                            let minute = d.getMinutes();
                            const isAM = hour < 12;
                            let hour12 = hour % 12;
                            if (hour12 === 0) hour12 = 12;
                            // Western numerals
                            const toWestern = (n) =>
                              n.toLocaleString("en-US", { useGrouping: false });
                            return `${toWestern(day)} ${month} ${toWestern(year)} ÙÙŠ ${toWestern(hour12)}:${toWestern(minute.toString().padStart(2, "0"))} ${isAM ? "Øµ" : "Ù…"}`;
                          })()
                        : formatDateTime(
                            item.createdAt || item.created_at,
                            dateLocale,
                            placeholder,
                          )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-(--ui-muted-foreground)">
                      {t("analysisHistory.confidence")}
                    </div>
                    <div className="px-2 py-1 bg-(--ui-success-bg) border border-(--ui-success-border) text-(--ui-foreground) rounded-full text-sm font-medium">
                      {(Number(item.confidence || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {/* Removed saved-to-history text as requested */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelected(item)}
                      className="px-3 py-1 btn-gradient rounded-md text-sm"
                    >
                      {t("analysisHistory.view")}
                    </button>
                    <button
                      onClick={async () => {
                        const ok =
                          typeof window !== "undefined"
                            ? window.confirm(t("analysisHistory.confirmDelete"))
                            : true;
                        if (!ok) return;
                        const id = item.id;
                        setDeletingId(id);
                        try {
                          const token =
                            typeof window !== "undefined"
                              ? localStorage.getItem("token")
                              : null;
                          const res = await fetch("/api/analysis/history", {
                            method: "DELETE",
                            headers: {
                              "Content-Type": "application/json",
                              ...(token
                                ? { Authorization: `Bearer ${token}` }
                                : {}),
                            },
                            body: JSON.stringify({ id }),
                          });
                          const body = await res.json().catch(() => ({}));
                          if (!res.ok)
                            throw new Error(
                              body.error ||
                                body.message ||
                                `HTTP ${res.status}`,
                            );
                          setRecords((prev) => prev.filter((r) => r.id !== id));
                          if (selected && selected.id === id) setSelected(null);
                        } catch (e) {
                          setError(e.message || String(e));
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      disabled={deletingId === item.id}
                      className="px-3 py-1 bg-(--ui-danger) text-(--ui-danger-foreground) rounded-md text-sm hover:opacity-90 disabled:opacity-60"
                    >
                      {deletingId === item.id
                        ? t("analysisHistory.deleting")
                        : t("analysisHistory.delete")}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {selected && (
        <AnalysisDetailsModal
          record={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
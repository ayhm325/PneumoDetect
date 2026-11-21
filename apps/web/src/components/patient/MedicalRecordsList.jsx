"use client";

import { useTranslations } from "@/lib/compat/intl";
import useLocale from "@/hooks/useLocale";

export default function MedicalRecordsList({ records = [], onView }) {
  const t = useTranslations("patient");
  const ui = useTranslations("ui");
  const { locale } = useLocale();
  const placeholder = ui("placeholder");

  return (
    <section className="card-glass rounded-xl border border-(--ui-border) shadow-sm">
      <header className="flex items-center justify-between border-b border-(--ui-border) p-4">
        <h2 className="text-lg font-semibold text-(--ui-foreground)">
          {t("components.medicalRecords.title")}
        </h2>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-(--ui-border)">
          <thead className="bg-(--ui-surface-2)/40">
            <tr>
              <Th>{t("components.medicalRecords.columns.file")}</Th>
              <Th>{t("components.medicalRecords.columns.type")}</Th>
              <Th>{t("components.medicalRecords.columns.examDate")}</Th>
              <Th>{t("components.medicalRecords.columns.reportStatus")}</Th>
              <Th>{t("components.medicalRecords.columns.action")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--ui-border) bg-(--ui-surface)">
            {records.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-center text-(--ui-muted-foreground)"
                  colSpan={5}
                >
                  {t("components.medicalRecords.empty")}
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-(--ui-surface-2)/40">
                  <Td className="font-mono">{r.name}</Td>
                  <Td>{typeLabel(r.type, t, placeholder)}</Td>
                  <Td>{formatDate(r.date, locale, placeholder)}</Td>
                  <Td>
                    <StatusBadge
                      status={r.status}
                      t={t}
                      placeholder={placeholder}
                    />
                  </Td>
                  <Td>
                    <button
                      onClick={() => onView?.(r)}
                      className="btn-gradient rounded-md px-3 py-1.5 text-sm text-white"
                    >
                      {t("components.medicalRecords.viewDetails")}
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-(--ui-muted-foreground)">
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return (
    <td className={`px-4 py-3 text-right text-(--ui-foreground) ${className}`}>
      {children}
    </td>
  );
}
function StatusBadge({ status, t, placeholder }) {
  const map = {
    ready: {
      label: t("components.medicalRecords.status.ready"),
      className:
        "bg-(--ui-success)/12 text-(--ui-success-foreground) ring-(--ui-success)/25",
    },
    processing: {
      label: t("components.medicalRecords.status.processing"),
      className:
        "bg-(--ui-warning)/12 text-(--ui-warning-foreground) ring-(--ui-warning)/25",
    },
  };
  const fallback = {
    label: placeholder,
    className:
      "bg-(--ui-surface-2)/60 text-(--ui-muted-foreground) ring-(--ui-border)",
  };
  const { label, className } = map[status] || fallback;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}
function typeLabel(type, t, placeholder) {
  const map = {
    xray: t("components.medicalRecords.type.xray"),
    mri: t("components.medicalRecords.type.mri"),
    ct: t("components.medicalRecords.type.ct"),
  };
  return map[type] || placeholder;
}
function formatDate(iso, locale, placeholder) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return placeholder;
  }
}
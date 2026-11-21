"use client";
import { formatDate } from "@/app/lib/date";
import useLocale from "@/hooks/useLocale";
import { useTranslations } from "@/lib/compat/intl";

export default function ScansTable({
  scans = [],
  onView,
  onDownload,
  onRequestReview,
}) {
  const { locale } = useLocale();
  const t = useTranslations("patientScansTable");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  const labelType = (type) => {
    const map = {
      xray: t("types.xray"),
      ct: t("types.ct"),
      mri: t("types.mri"),
    };
    return map[type] || placeholder;
  };

  return (
    <section className="card-glass rounded-xl border border-(--ui-border) backdrop-blur-sm shadow-sm">
      <header className="flex items-center justify-between border-b border-(--ui-border) p-4">
        <h2 className="text-lg font-semibold text-(--ui-foreground)">
          {t("title")}
        </h2>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-(--ui-border)">
          <thead className="bg-(--ui-surface-2)/40">
            <tr>
              <Th>{t("columns.id")}</Th>
              <Th>{t("columns.type")}</Th>
              <Th>{t("columns.uploadedAt")}</Th>
              <Th>{t("columns.status")}</Th>
              <Th>{t("columns.aiSummary")}</Th>
              <Th>{t("columns.doctorNotes")}</Th>
              <Th>{t("columns.actions")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--ui-border) bg-(--ui-surface)">
            {scans.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-center text-(--ui-muted-foreground)"
                  colSpan={7}
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              scans.map((s) => (
                <tr key={s.id} className="hover:bg-(--ui-surface-2)/40">
                  <Td className="font-mono">{s.id}</Td>
                  <Td>{labelType(s.type)}</Td>
                  <Td>{formatDate(s.date, locale, placeholder)}</Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td className="text-sm text-(--ui-muted-foreground)">
                    {s.aiSummary || placeholder}
                  </Td>
                  <Td className="text-sm text-(--ui-muted-foreground)">
                    {s.doctorNotes || placeholder}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <ActionButton onClick={() => onView?.(s)}>
                        {t("actions.view")}
                      </ActionButton>
                      <ActionButton
                        onClick={() => onDownload?.(s)}
                        variant="secondary"
                      >
                        {t("actions.download")}
                      </ActionButton>
                      <ActionButton
                        onClick={() => onRequestReview?.(s)}
                        variant="accent"
                      >
                        {t("actions.requestReview")}
                      </ActionButton>
                    </div>
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

function StatusBadge({ status }) {
  const t = useTranslations("patientScansTable");
  const map = {
    reviewed: {
      label: t("statuses.reviewed"),
      className:
        "bg-(--ui-success)/12 text-(--ui-success-foreground) ring-(--ui-success)/25",
    },
    pending: {
      label: t("statuses.pending"),
      className:
        "bg-(--ui-warning)/12 text-(--ui-warning-foreground) ring-(--ui-warning)/25",
    },
  };
  const fallback = {
    label: t("statuses.unknown"),
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

function ActionButton({ children, onClick, variant = "primary" }) {
  const variants = {
    primary: "btn-gradient text-white",
    secondary:
      "bg-(--ui-surface-2)/60 hover:bg-(--ui-surface-2)/80 text-(--ui-foreground) border border-(--ui-border)",
    accent:
      "bg-(--ui-info) hover:bg-(--ui-info)/90 text-(--ui-info-foreground)",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm transition ${variants[variant]}`}
    >
      {children}
    </button>
  );
}
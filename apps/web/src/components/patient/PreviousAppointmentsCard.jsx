"use client";

import { useTranslations } from "@/lib/compat/intl";
import useLocale from "@/hooks/useLocale";

export default function PreviousAppointmentsCard({
  visits = [],
  onViewDetails,
}) {
  const t = useTranslations("patient");
  const ui = useTranslations("ui");
  const { locale } = useLocale();
  const placeholder = ui("placeholder");

  return (
    <section className="card-glass rounded-xl border border-(--ui-border) shadow-sm">
      <header className="flex items-center justify-between border-b border-(--ui-border) p-4">
        <h2 className="text-lg font-semibold text-(--ui-foreground)">
          {t("components.previousAppointments.title")}
        </h2>
      </header>
      <ul className="divide-y divide-(--ui-border)">
        {visits.length === 0 ? (
          <li className="p-4 text-(--ui-muted-foreground)">
            {t("components.previousAppointments.empty")}
          </li>
        ) : (
          visits.map((v) => (
            <li key={v.id} className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <div className="text-sm text-(--ui-muted-foreground)">
                  {t("components.previousAppointments.dateLabel")}
                </div>
                <div className="text-base font-medium text-(--ui-foreground)">
                  {formatDate(v.date, locale, placeholder)}
                </div>
                <div className="text-sm text-(--ui-muted-foreground)">
                  {v.type || placeholder}
                </div>
                <div className="text-sm text-(--ui-muted-foreground)">
                  {t("components.previousAppointments.doctorPrefix")}{" "}
                  {v.doctorName || placeholder}
                </div>
              </div>
              <button
                onClick={() => onViewDetails?.(v)}
                className="btn-gradient rounded-md px-3 py-1.5 text-sm text-white"
              >
                {t("components.previousAppointments.viewDetails")}
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
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

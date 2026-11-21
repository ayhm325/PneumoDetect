"use client";
import { formatDateTime } from "@/app/lib/date";
import useLocale from "@/hooks/useLocale";
import { useTranslations } from "@/lib/compat/intl";

export default function UpcomingAppointmentsCard({ appointments = [] }) {
  const { locale } = useLocale();
  const t = useTranslations("patient");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");
  return (
    <section className="card-glass rounded-xl border border-(--ui-border) shadow-sm">
      <header className="flex items-center justify-between border-b border-(--ui-border) p-4">
        <h2 className="text-lg font-semibold text-(--ui-foreground)">
          {t("components.upcomingAppointments.title")}
        </h2>
      </header>
      <ul className="divide-y divide-(--ui-border)">
        {appointments.length === 0 ? (
          <li className="p-4 text-(--ui-muted-foreground)">
            {t("components.upcomingAppointments.empty")}
          </li>
        ) : (
          appointments.map((a) => (
            <li key={a.id} className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <div className="text-sm text-(--ui-muted-foreground)">
                  {t("components.upcomingAppointments.doctorLabel")}
                </div>
                <div className="text-base font-medium text-(--ui-foreground)">
                  {a.doctorName}
                </div>
                <div className="text-sm text-(--ui-muted-foreground)">
                  {a.type}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-(--ui-muted-foreground)">
                  {t("components.upcomingAppointments.dateLabel")}
                </div>
                <div className="text-base font-medium text-(--ui-foreground)">
                  {formatDateTime(a.datetime, locale, placeholder)}
                </div>
                <StatusBadge
                  status={a.status}
                  t={t}
                  placeholder={placeholder}
                />
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function StatusBadge({ status, t, placeholder }) {
  const map = {
    confirmed: {
      label: t("appointments.status.confirmed"),
      className:
        "bg-(--ui-success)/12 text-(--ui-success-foreground) ring-(--ui-success)/25",
    },
    pending: {
      label: t("appointments.status.pending"),
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
      className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-xs ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}
"use client";

import { useTranslations } from "@/lib/compat/intl";

export default function MyDoctorCard({ name, specialty, status, contact }) {
  const t = useTranslations("patient");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  return (
    <section className="card-glass rounded-xl border border-(--ui-border) shadow-sm">
      <header className="flex items-center justify-between border-b border-(--ui-border) p-4">
        <h2 className="text-lg font-semibold text-(--ui-foreground)">
          {t("components.myDoctor.title")}
        </h2>
      </header>
      <div className="flex items-center justify-between p-4">
        <div>
          <div className="text-base font-semibold text-(--ui-foreground)">
            {name || placeholder}
          </div>
          <div className="text-sm text-(--ui-muted-foreground)">
            {specialty || placeholder}
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="text-right text-sm text-(--ui-muted-foreground)">
          {contact?.email && (
            <div>
              {t("components.myDoctor.labels.email")} {contact.email}
            </div>
          )}
          {contact?.phone && (
            <div>
              {t("components.myDoctor.labels.phone")} {contact.phone}
            </div>
          )}
          <button className="btn-gradient mt-2 rounded-md px-3 py-1.5 text-white">
            {t("components.myDoctor.actions.requestConsultation")}
          </button>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  const map = {
    online: {
      label: ui("status.online"),
      className:
        "bg-(--ui-success)/12 text-(--ui-success-foreground) ring-(--ui-success)/25",
    },
    offline: {
      label: ui("status.offline"),
      className:
        "bg-(--ui-surface-2)/60 text-(--ui-muted-foreground) ring-(--ui-border)",
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
      className={`mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}

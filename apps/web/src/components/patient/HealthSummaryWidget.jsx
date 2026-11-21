"use client";

import { useTranslations } from "@/lib/compat/intl";

export default function HealthSummaryWidget({
  weight,
  height,
  bmi,
  allergies = [],
  chronic = [],
}) {
  const t = useTranslations("patient");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  return (
    <section className="card-glass rounded-xl border border-(--ui-border) shadow-sm">
      <header className="flex items-center justify-between border-b border-(--ui-border) p-4">
        <h2 className="text-lg font-semibold text-(--ui-foreground)">
          {t("healthSummary.title")}
        </h2>
      </header>
      <div className="grid gap-4 p-4 sm:grid-cols-3">
        <Info
          label={t("healthSummary.labels.weight")}
          value={
            weight ? `${weight} ${t("healthSummary.units.kg")}` : placeholder
          }
        />
        <Info
          label={t("healthSummary.labels.height")}
          value={
            height ? `${height} ${t("healthSummary.units.cm")}` : placeholder
          }
        />
        <Info
          label={t("healthSummary.labels.bmi")}
          value={bmi ?? placeholder}
        />
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <List
          label={t("healthSummary.labels.allergies")}
          items={allergies}
          emptyLabel={t("healthSummary.noData")}
        />
        <List
          label={t("healthSummary.labels.chronic")}
          items={chronic}
          emptyLabel={t("healthSummary.noData")}
        />
      </div>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md border border-(--ui-border) bg-(--ui-surface-2)/40 p-3">
      <div className="text-sm text-(--ui-muted-foreground)">{label}</div>
      <div className="text-base font-medium text-(--ui-foreground)">
        {value}
      </div>
    </div>
  );
}

function List({ label, items, emptyLabel }) {
  return (
    <div className="rounded-md border border-(--ui-border) bg-(--ui-surface-2)/40 p-3">
      <div className="mb-1 text-sm text-(--ui-muted-foreground)">{label}</div>
      {items && items.length > 0 ? (
        <ul className="list-disc space-y-1 pl-4 text-sm text-(--ui-foreground)">
          {items.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-(--ui-muted-foreground)">{emptyLabel}</div>
      )}
    </div>
  );
}

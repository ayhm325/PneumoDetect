"use client";
import { formatDateTimeASCII } from "@/app/lib/date";
import { useTranslations } from "@/lib/compat/intl";

export default function PatientNotifications({ items = [] }) {
  const t = useTranslations("patient");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");
  return (
    <section className="card-glass rounded-xl border border-(--ui-border) shadow-sm">
      <header className="flex items-center justify-between border-b border-(--ui-border) p-4">
        <h2 className="text-lg font-semibold text-(--ui-foreground)">
          {t("components.notifications.title")}
        </h2>
      </header>
      <ul className="divide-y divide-(--ui-border)">
        {items.length === 0 ? (
          <li className="p-4 text-(--ui-muted-foreground)">
            {t("components.notifications.empty")}
          </li>
        ) : (
          items.map((n) => (
            <li key={n.id} className="flex items-start justify-between p-4">
              <div>
                <div className="text-sm font-medium text-(--ui-foreground)">
                  {n.title}
                </div>
                <div className="text-sm text-(--ui-muted-foreground)">
                  {n.description}
                </div>
              </div>
              <span className="text-xs text-(--ui-muted-foreground)">
                {formatDateTimeASCII(n.datetime, placeholder)}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

"use client";

import { useTranslations } from "@/lib/compat/intl";

export default function SupportCenter() {
  const t = useTranslations("patient");

  return (
    <section className="card-glass rounded-xl border border-(--ui-border) shadow-sm">
      <header className="flex items-center justify-between border-b border-(--ui-border) p-4">
        <h2 className="text-lg font-semibold text-(--ui-foreground)">
          {t("components.supportCenter.title")}
        </h2>
      </header>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <form
          className="space-y-3 rounded-md border border-(--ui-border) bg-(--ui-surface) p-3"
          onSubmit={(e) => {
            e.preventDefault();
            alert(t("components.supportCenter.alerts.submitted"));
          }}
        >
          <div className="text-sm font-medium text-(--ui-foreground)">
            {t("components.supportCenter.form.title")}
          </div>
          <input
            placeholder={t("components.supportCenter.form.subjectPlaceholder")}
            className="w-full rounded-md border border-(--ui-border) bg-(--ui-surface) px-3 py-2 text-sm text-(--ui-foreground) placeholder:text-(--ui-muted-foreground)"
          />
          <textarea
            placeholder={t(
              "components.supportCenter.form.descriptionPlaceholder",
            )}
            className="w-full rounded-md border border-(--ui-border) bg-(--ui-surface) px-3 py-2 text-sm text-(--ui-foreground) placeholder:text-(--ui-muted-foreground)"
            rows={4}
          />
          <button className="btn-gradient rounded-md px-4 py-2 text-sm text-white">
            {t("components.supportCenter.form.submit")}
          </button>
        </form>

        <div className="space-y-3 rounded-md border border-(--ui-border) bg-(--ui-surface) p-3">
          <div className="text-sm font-medium text-(--ui-foreground)">
            {t("components.supportCenter.faq.title")}
          </div>
          <ul className="list-disc space-y-1 pl-4 text-sm text-(--ui-muted-foreground)">
            <li>{t("components.supportCenter.faq.items.uploadXray")}</li>
            <li>{t("components.supportCenter.faq.items.requestReview")}</li>
            <li>{t("components.supportCenter.faq.items.editAccount")}</li>
          </ul>
          <div className="text-sm text-(--ui-muted-foreground)">
            {t("components.supportCenter.requestsStatus")}
          </div>
        </div>
      </div>
    </section>
  );
}
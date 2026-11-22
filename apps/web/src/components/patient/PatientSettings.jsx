"use client";

import { useTranslations } from "@/lib/compat/intl";
import { GlideSelect } from "@/components/ui";

export default function PatientSettings({ onSave }) {
  const t = useTranslations("patientSettings");
  const tTheme = useTranslations("theme");

  return (
    <section className="card-glass rounded-xl border border-(--ui-border) shadow-sm">
      <header className="flex items-center justify-between border-b border-(--ui-border) p-4">
        <h2 className="text-lg font-semibold text-(--ui-foreground)">
          {t("title")}
        </h2>
      </header>
      <form
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave?.();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--ui-muted-foreground)">
              {t("fields.newPassword")}
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-(--ui-border) bg-(--ui-surface) px-3 py-2 text-sm text-(--ui-foreground)"
            />
          </div>
          <div>
            <label className="text-sm text-(--ui-muted-foreground)">
              {t("fields.email")}
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-(--ui-border) bg-(--ui-surface) px-3 py-2 text-sm text-(--ui-foreground)"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--ui-muted-foreground)">
              {t("fields.doctorVisibility")}
            </label>
            <div className="mt-1">
              <GlideSelect
                fullWidth
                options={[
                  { value: "full", label: t("visibility.full") },
                  { value: "partial", label: t("visibility.partial") },
                  { value: "private", label: t("visibility.private") },
                ]}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-(--ui-muted-foreground)">
              {t("fields.languageAppearance")}
            </label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <GlideSelect
                fullWidth
                options={[
                  { value: "ar", label: t("language.arabic") },
                  { value: "en", label: t("language.english") },
                ]}
              />
              <GlideSelect
                fullWidth
                options={[
                  { value: "light", label: tTheme("mode.light") },
                  { value: "dark", label: tTheme("mode.dark") },
                ]}
              />
            </div>
          </div>
        </div>
        <div className="pt-2">
          <button className="btn-gradient rounded-md px-4 py-2 text-sm text-white">
            {t("actions.save")}
          </button>
        </div>
      </form>
    </section>
  );
}
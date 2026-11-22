import React from "react";
import Link from "@/lib/compat/Link";
import { useTranslations } from "@/lib/compat/intl";
import { ContentPageLayout } from "@/components/layouts/ContentPageLayout";
import UnifiedCard from "@/components/ui/UnifiedCard";

export default function ServicesPage() {
  const t = useTranslations("services");
  const rawList = t.raw("list");
  const services = Array.isArray(rawList) ? rawList : [];

  return (
    <div className="mx-auto max-w-6xl py-6 sm:py-10">
      <ContentPageLayout title={t("title")} subtitle={t("description")}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, idx) => (
            <UnifiedCard
              key={idx}
              className="flex flex-col items-center rounded-2xl border border-[var(--ui-border)] p-6 text-center transition-all hover:-translate-y-1 hover:border-[var(--color-primary-500)] hover:shadow-lg"
              glass
            >
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary-500)]/15 text-base font-bold text-[var(--color-primary-500)]">
                {idx + 1}
              </div>
              <h2 className="mb-3 text-xl font-bold text-[var(--ui-foreground)]">
                {service.name}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--ui-muted)]">
                {service.desc}
              </p>
            </UnifiedCard>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl btn-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:opacity-95"
          >
            {t("backHome")}
          </Link>
        </div>
      </ContentPageLayout>
    </div>
  );
}

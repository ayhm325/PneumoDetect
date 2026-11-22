import React from "react";
import { useLocale } from "@/lib/compat/intl";
import aboutEn from "@/i18n/locales/en/about.json";
import aboutAr from "@/i18n/locales/ar/about.json";
import Link from "@/lib/compat/Link";
import { ContentPageLayout } from "@/components/layouts/ContentPageLayout";
import UnifiedCard from "@/components/ui/UnifiedCard";

export default function AboutPageClient() {
  const locale = useLocale();
  const data = locale === "ar" ? aboutAr : aboutEn;
  const values = Array.isArray(data.valuesList) ? data.valuesList : [];
  const stats = Array.isArray(data.stats) ? data.stats : [];
  const techList = Array.isArray(data.techList) ? data.techList : [];

  return (
    <div className="mx-auto max-w-5xl py-6 sm:py-10">
      <ContentPageLayout title={data.title} subtitle={data.description}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <UnifiedCard className="rounded-2xl border border-[var(--ui-border)] p-6" glass>
            <h2 className="mb-2 text-xl font-bold text-[var(--ui-foreground)]">{data.visionTitle}</h2>
            <p className="text-sm leading-relaxed text-[var(--ui-muted)]">{data.visionDesc}</p>
          </UnifiedCard>
          <UnifiedCard className="rounded-2xl border border-[var(--ui-border)] p-6" glass>
            <h2 className="mb-2 text-xl font-bold text-[var(--ui-foreground)]">{data.missionTitle}</h2>
            <p className="text-sm leading-relaxed text-[var(--ui-muted)]">{data.missionDesc}</p>
          </UnifiedCard>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold text-[var(--ui-foreground)]">{data.valuesTitle}</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {values.map((v, i) => (
              <li key={i} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 shadow-xs">
                <h3 className="mb-1.5 font-bold text-[var(--color-primary-500)]">{v.title}</h3>
                <p className="text-sm text-[var(--ui-muted)]">{v.desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold text-[var(--ui-foreground)]">{data.statsTitle}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {stats.map((s, i) => (
              <div key={i} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 text-center shadow-xs">
                <div className="text-2xl font-bold text-[var(--color-primary-500)]">{s.num}</div>
                <div className="mt-1 text-xs font-medium text-[var(--ui-muted)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <UnifiedCard className="rounded-2xl border border-[var(--ui-border)] p-6" glass>
          <h2 className="mb-2 text-xl font-bold text-[var(--ui-foreground)]">{data.techTitle}</h2>
          <p className="mb-4 text-sm text-[var(--ui-muted)]">{data.techDesc}</p>
          <ul className="flex flex-wrap gap-2.5">
            {techList.map((tech, i) => (
              <li
                key={i}
                className="rounded-full bg-[var(--color-primary-500)]/15 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-primary-500)]"
              >
                {tech}
              </li>
            ))}
          </ul>
        </UnifiedCard>

        <div className="flex justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl btn-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:opacity-95"
          >
            {data.backToHome}
          </Link>
        </div>
      </ContentPageLayout>
    </div>
  );
}

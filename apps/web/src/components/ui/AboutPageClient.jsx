import React from "react";
import { CompassIcon, CpuIcon, SparklesIcon } from "lucide-react";
import { useLocale } from "@/lib/compat/intl";
import aboutEn from "@/i18n/locales/en/about.json";
import aboutAr from "@/i18n/locales/ar/about.json";
import Link from "@/lib/compat/Link";
import { ContentPageLayout } from "@/components/layouts/ContentPageLayout";
import { Surface } from "@/components/ui";

export default function AboutPageClient() {
  const locale = useLocale();
  const data = locale === "ar" ? aboutAr : aboutEn;
  const values = Array.isArray(data.valuesList) ? data.valuesList : [];
  const stats = Array.isArray(data.stats) ? data.stats : [];
  const techList = Array.isArray(data.techList) ? data.techList : [];

  return (
    <div className="mx-auto max-w-5xl py-6 sm:py-12">
      <ContentPageLayout title={data.title} subtitle={data.description}>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Surface shape="asymmetric" tone="copper" className="p-7">
            <div className="pd-orb pd-shape-orbital pd-orb--copper mb-4">
              <CompassIcon size={20} strokeWidth={1.6} />
            </div>
            <h2 className="mb-2.5 text-xl font-medium text-[var(--pd-text-primary)]">{data.visionTitle}</h2>
            <p className="text-[15px] leading-relaxed text-[var(--pd-text-secondary)]">{data.visionDesc}</p>
          </Surface>
          <Surface shape="layered" className="p-7">
            <div className="pd-orb pd-shape-orbital pd-orb--sage mb-4">
              <SparklesIcon size={20} strokeWidth={1.6} />
            </div>
            <h2 className="mb-2.5 text-xl font-medium text-[var(--pd-text-primary)]">{data.missionTitle}</h2>
            <p className="text-[15px] leading-relaxed text-[var(--pd-text-secondary)]">{data.missionDesc}</p>
          </Surface>
        </div>

        <div className="space-y-5 pt-4">
          <h2 className="text-xl font-medium text-[var(--pd-text-primary)]">{data.valuesTitle}</h2>
          <ul className="grid gap-7 md:grid-cols-3">
            {values.map((v, i) => (
              <li key={i} className="pd-shape-editorial">
                <h3 className="mb-2 text-base font-medium text-[var(--pd-copper)]">{v.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--pd-text-secondary)]">{v.desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5 pt-4">
          <h2 className="text-xl font-medium text-[var(--pd-text-primary)]">{data.statsTitle}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="pd-shape-orbital h-20 w-20 shrink-0 border border-[var(--pd-copper-border)] bg-[var(--pd-surface-inset)]">
                  <span className="pd-metric-value !text-xl text-[var(--pd-copper)]">{s.num}</span>
                </div>
                <div className="text-sm font-medium text-[var(--pd-text-secondary)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <Surface shape="slanted" className="p-7 sm:p-9">
          <div className="mb-3 flex items-center gap-3">
            <div className="pd-orb pd-orb--sm pd-shape-orbital pd-orb--copper">
              <CpuIcon size={17} strokeWidth={1.6} />
            </div>
            <h2 className="text-xl font-medium text-[var(--pd-text-primary)]">{data.techTitle}</h2>
          </div>
          <p className="mb-5 text-[15px] leading-relaxed text-[var(--pd-text-secondary)]">{data.techDesc}</p>
          <ul className="flex flex-wrap gap-2.5">
            {techList.map((tech, i) => (
              <li
                key={i}
                className="rounded-full border border-[var(--pd-copper-border)] bg-[var(--pd-copper-soft)] px-4 py-1.5 text-xs font-medium text-[var(--pd-copper)]"
              >
                {tech}
              </li>
            ))}
          </ul>
        </Surface>

        <div className="flex justify-center pt-4">
          <Link href="/" className="pd-btn pd-btn--primary">
            {data.backToHome}
          </Link>
        </div>
      </ContentPageLayout>
    </div>
  );
}

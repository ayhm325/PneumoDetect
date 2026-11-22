import React from "react";
import Link from "@/lib/compat/Link";
import { useLocale } from "@/lib/compat/intl";
import termsAr from "@/i18n/locales/ar/terms.json";
import termsEn from "@/i18n/locales/en/terms.json";
import { ContentPageLayout } from "@/components/layouts/ContentPageLayout";

export default function TermsPage() {
  const locale = useLocale();
  const t = locale === "en" ? termsEn : termsAr;
  const dateLocale = locale === "en" ? "en-US" : "ar-EG";

  return (
    <div className="mx-auto max-w-4xl py-6 sm:py-10">
      <ContentPageLayout
        title={t.title}
        subtitle={`${t.lastUpdate}: ${new Date("2025-12-20").toLocaleDateString(dateLocale)}`}
      >
        <div className="pd-panel pd-panel--feature p-6 sm:p-10">
          <div className="space-y-8 text-sm leading-relaxed text-[var(--pd-text-secondary)] sm:text-base">
            <section>
              <h2 className="mb-2 text-xl font-semibold text-[var(--pd-acid)]">{t.acceptance?.title}</h2>
              <p>{t.acceptance?.content}</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[var(--pd-acid)]">
                {t.serviceDescription?.title}
              </h2>
              <p>{t.serviceDescription?.intro}</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[var(--pd-acid)]">{t.registration?.title}</h2>
              <p className="mb-2">{t.registration?.intro}</p>
              {Array.isArray(t.registration?.items) && t.registration.items.length > 0 && (
                <ul className="list-disc space-y-1.5 ps-6">
                  {t.registration.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[var(--pd-acid)]">{t.serviceUsage?.title}</h2>
              <h3 className="mb-2 text-base font-semibold text-[var(--pd-text-primary)]">
                {t.serviceUsage?.allowed?.title}
              </h3>
              {Array.isArray(t.serviceUsage?.allowed?.items) && t.serviceUsage.allowed.items.length > 0 && (
                <ul className="mb-4 list-disc space-y-1.5 ps-6">
                  {t.serviceUsage.allowed.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
              <h3 className="mb-2 text-base font-semibold text-[var(--pd-text-primary)]">
                {t.serviceUsage?.prohibited?.title}
              </h3>
              {Array.isArray(t.serviceUsage?.prohibited?.items) && t.serviceUsage.prohibited.items.length > 0 && (
                <ul className="list-disc space-y-1.5 ps-6">
                  {t.serviceUsage.prohibited.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="pd-panel pd-panel--leaf border-[color-mix(in_srgb,var(--pd-coral)_36%,transparent)] bg-[var(--pd-coral-soft)] p-5">
                <h2 className="mb-2 text-xl font-semibold text-[var(--pd-coral)]">
                  {t.medicalDisclaimer?.title}
                </h2>
                <p className="font-medium text-[var(--pd-text-primary)]">{t.medicalDisclaimer?.content}</p>
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[var(--pd-acid)]">{t.limitation?.title}</h2>
              {Array.isArray(t.limitation?.items) && t.limitation.items.length > 0 && (
                <ul className="list-disc space-y-1.5 ps-6">
                  {t.limitation.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[var(--pd-acid)]">{t.changes?.title}</h2>
              <p>{t.changes?.content}</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[var(--pd-acid)]">{t.contact?.title}</h2>
              <p>{t.contact?.content}</p>
            </section>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Link href="/" className="pd-btn pd-btn--primary">
            {t.backToHome}
          </Link>
        </div>
      </ContentPageLayout>
    </div>
  );
}

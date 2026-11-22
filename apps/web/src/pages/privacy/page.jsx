import React from "react";
import Link from "@/lib/compat/Link";
import { useLocale } from "@/lib/compat/intl";
import privacyAr from "@/i18n/locales/ar/privacy.json";
import privacyEn from "@/i18n/locales/en/privacy.json";
import { ContentPageLayout } from "@/components/layouts/ContentPageLayout";

export default function PrivacyPolicyPage() {
  const locale = useLocale();
  const t = locale === "en" ? privacyEn : privacyAr;
  const dateLocale = locale === "en" ? "en-US" : "ar-EG";

  return (
    <div className="mx-auto max-w-4xl py-6 sm:py-10">
      <ContentPageLayout
        title={t.title}
        subtitle={`${t.lastUpdate}: ${new Date().toLocaleDateString(dateLocale)}`}
      >
        <div className="pd-panel pd-panel--feature p-6 sm:p-10">
          <div className="space-y-8 text-sm leading-relaxed text-[var(--pd-text-secondary)] sm:text-base">
            <section>
              <h2 className="mb-2 text-xl font-semibold text-[var(--pd-acid)]">
                {t.introduction?.title}
              </h2>
              <p>{t.introduction?.content}</p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[var(--pd-acid)]">
                {t.informationCollection?.title}
              </h2>
              <div className="space-y-4">
                {Object.entries(t.informationCollection || {})
                  .filter(([k]) => k !== "title")
                  .map(([key, val]) => (
                    <div key={key} className="pd-editorial">
                      <h3 className="mb-1 text-base font-semibold text-[var(--pd-text-primary)]">
                        {val?.title}
                      </h3>
                      <p>{val?.content}</p>
                    </div>
                  ))}
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[var(--pd-acid)]">{t.dataUsage?.title}</h2>
              <p>{t.dataUsage?.content}</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[var(--pd-acid)]">{t.dataProtection?.title}</h2>
              <p>{t.dataProtection?.content}</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[var(--pd-acid)]">{t.userRights?.title}</h2>
              <p>{t.userRights?.content}</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[var(--pd-acid)]">{t.cookies?.title}</h2>
              <p>{t.cookies?.content}</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[var(--pd-acid)]">{t.policyChanges?.title}</h2>
              <p>{t.policyChanges?.content}</p>
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

import React from "react";
import Link from "@/lib/compat/Link";
import { useLocale } from "@/lib/compat/intl";
import privacyAr from "@/i18n/locales/ar/privacy.json";
import privacyEn from "@/i18n/locales/en/privacy.json";
import { ContentPageLayout } from "@/components/layouts/ContentPageLayout";
import UnifiedCard from "@/components/ui/UnifiedCard";

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
        <UnifiedCard className="rounded-2xl border border-[var(--ui-border)] p-6 sm:p-10" glass>
          <div className="space-y-8 text-sm leading-relaxed text-[var(--ui-foreground)] sm:text-base">
            <section>
              <h2 className="mb-2 text-xl font-bold text-[var(--color-primary-500)]">
                {t.introduction?.title}
              </h2>
              <p className="text-[var(--ui-muted)]">{t.introduction?.content}</p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-[var(--color-primary-500)]">
                {t.informationCollection?.title}
              </h2>
              <div className="space-y-4">
                {Object.entries(t.informationCollection || {})
                  .filter(([k]) => k !== "title")
                  .map(([key, val]) => (
                    <div key={key}>
                      <h3 className="mb-1 text-base font-semibold text-[var(--ui-foreground)]">
                        {val?.title}
                      </h3>
                      <p className="text-[var(--ui-muted)]">{val?.content}</p>
                    </div>
                  ))}
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-[var(--color-primary-500)]">
                {t.dataUsage?.title}
              </h2>
              <p className="text-[var(--ui-muted)]">{t.dataUsage?.content}</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-[var(--color-primary-500)]">
                {t.dataProtection?.title}
              </h2>
              <p className="text-[var(--ui-muted)]">{t.dataProtection?.content}</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-[var(--color-primary-500)]">
                {t.userRights?.title}
              </h2>
              <p className="text-[var(--ui-muted)]">{t.userRights?.content}</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-[var(--color-primary-500)]">
                {t.cookies?.title}
              </h2>
              <p className="text-[var(--ui-muted)]">{t.cookies?.content}</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-[var(--color-primary-500)]">
                {t.policyChanges?.title}
              </h2>
              <p className="text-[var(--ui-muted)]">{t.policyChanges?.content}</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-[var(--color-primary-500)]">
                {t.contact?.title}
              </h2>
              <p className="text-[var(--ui-muted)]">{t.contact?.content}</p>
            </section>
          </div>
        </UnifiedCard>

        <div className="flex justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl btn-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:opacity-95"
          >
            {t.backToHome}
          </Link>
        </div>
      </ContentPageLayout>
    </div>
  );
}

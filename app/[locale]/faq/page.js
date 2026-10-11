export const dynamicParams = true;

import { getTranslations } from "next-intl/server";
import LanguageToggle from "../../components/ui/LanguageToggle";
import React from "react";
import UnifiedCard from "../../components/ui/UnifiedCard";

export async function generateMetadata() {
  const t = await getTranslations("meta.faq");
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
  };
}

export default async function FAQPage(props) {
  const params = props.params
    ? typeof props.params.then === "function"
      ? await props.params
      : props.params
    : {};
  const locale = params?.locale;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const faqData = (await import(`../../locales/${locale}/faq.json`)).default;
  const t = faqData;
  const faqs = t.categories || [];

  function buildPath(targetLocale, path = "/") {
    const cleanPath = path.replace(/^\/(en|ar)/, "");
    const normalized = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    return `/${targetLocale}${normalized}`;
  }

  return (
    <div
      className="min-h-screen bg-(--ui-surface) text-(--ui-foreground) py-20"
      dir={dir}
      lang={locale}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Language toggle at the very top */}
        <div className="flex justify-end mb-8">
          <LanguageToggle currentLocale={locale} />
        </div>
        {/* Header */}
        <div className="text-center mb-16 animate-fadeIn">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="brand-gradient-text">{t.title}</span>
          </h1>
          <p className="text-xl text-(--ui-muted-foreground) max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        {/* Back to Home Button */}
        <div className="mt-10 text-center">
          <a
            href={buildPath(locale, "/")}
            className="btn-gradient inline-block px-8 py-4 font-bold rounded-full"
          >
            {t.backHome}
          </a>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqs.map((category, catIdx) => (
            <div
              key={catIdx}
              className={`animate-slideUp delay-[${catIdx * 100}ms]`}
            >
              <h2 className="text-3xl font-bold mb-6 text-(--ui-foreground) flex items-center gap-3">
                <span className="w-2 h-8 bg-(--ui-ring) rounded-full opacity-80"></span>
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((faq, qIdx) => (
                  <details
                    key={qIdx}
                    className="group overflow-hidden transition-all hover:shadow-xl"
                  >
                    <UnifiedCard className="rounded-2xl p-0" glass>
                      <summary className="cursor-pointer p-6 flex justify-between items-center text-lg font-semibold text-(--ui-foreground) list-none">
                        <span>{faq.q}</span>
                        <svg
                          className="w-6 h-6 text-(--ui-muted-foreground) transition-transform group-open:rotate-180"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </summary>
                      <div className="px-6 pb-6">
                        <p className="text-(--ui-muted-foreground) leading-relaxed border-t border-(--ui-border) pt-4">
                          {faq.a}
                        </p>
                      </div>
                    </UnifiedCard>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-16 brand-gradient rounded-3xl p-12 text-center text-white animate-fadeIn">
          <h3 className="text-3xl font-bold mb-4">{t.ctaTitle}</h3>
          <p className="text-xl mb-8 opacity-90">{t.ctaSubtitle}</p>
          <a
            href={buildPath(locale, "/contact")}
            className="inline-block px-8 py-4 bg-(--ui-surface) text-(--ui-foreground) font-bold rounded-full border border-(--ui-border) hover:bg-(--ui-surface-2) transition-colors shadow-lg"
          >
            {t.ctaButton}
          </a>
        </div>
      </div>
    </div>
  );
}

import LanguageToggle from "@/components/ui/LanguageToggle";
import UnifiedCard from "@/components/ui/UnifiedCard";

export default async function PrivacyPolicyPage(props) {
  const params = props.params
    ? typeof props.params.then === "function"
      ? await props.params
      : props.params
    : {};
  const locale = params?.locale;
  const t = (await import(`../../locales/${locale}/privacy.json`)).default;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const dateLocale = locale === "en" ? "en-US" : "ar-EG";

  return (
    <div
      className="min-h-screen bg-(--ui-surface) text-(--ui-foreground) py-20"
      dir={dir}
      lang={locale}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Language toggle at the very top */}
        <div className="flex justify-end mb-8">
          <LanguageToggle currentLocale={locale} />
        </div>
        {/* Header */}
        <div className="text-center mb-16 animate-fadeIn">
          <h1 className="text-5xl font-bold mb-6">
            <span className="brand-gradient-text">{t.title}</span>
          </h1>
          <p className="text-lg text-(--ui-muted-foreground)">
            {t.lastUpdate}: {new Date().toLocaleDateString(dateLocale)}
          </p>
        </div>
        {/* Content */}
        <UnifiedCard className="rounded-3xl p-8 md:p-12 border border-(--ui-border) animate-slideUp" glass>
          <div className="max-w-none space-y-12">
            {/* Introduction */}
            <section>
              <h2 className="section-title">{t.introduction?.title}</h2>
              <p>{t.introduction?.content}</p>
            </section>
            {/* Information Collection */}
            <section>
              <h2 className="section-title">
                {t.informationCollection?.title}
              </h2>
              {Object.entries(t.informationCollection || {})
                .filter(([k]) => k !== "title")
                .map(([key, val]) => (
                  <div key={key} className="mt-6">
                    <h3 className="text-xl font-semibold mb-2">{val.title}</h3>
                    <p>{val.content}</p>
                  </div>
                ))}
            </section>
            {/* Data Usage */}
            <section>
              <h2 className="section-title">{t.dataUsage?.title}</h2>
              <p>{t.dataUsage?.content}</p>
            </section>
            {/* Data Protection */}
            <section>
              <h2 className="section-title">{t.dataProtection?.title}</h2>
              <p>{t.dataProtection?.content}</p>
            </section>
            {/* User Rights */}
            <section>
              <h2 className="section-title">{t.userRights?.title}</h2>
              <p>{t.userRights?.content}</p>
            </section>
            {/* Cookies */}
            <section>
              <h2 className="section-title">{t.cookies?.title}</h2>
              <p>{t.cookies?.content}</p>
            </section>
            {/* Policy Changes */}
            <section>
              <h2 className="section-title">{t.policyChanges?.title}</h2>
              <p>{t.policyChanges?.content}</p>
            </section>
            {/* Contact */}
            <section>
              <h2 className="section-title">{t.contact?.title}</h2>
              <p>{t.contact?.content}</p>
            </section>
          </div>
        </UnifiedCard>
        {/* Back to Home */}
        <div className="mt-10 text-center">
          <a
            href={`/${locale}`}
            className="inline-block px-8 py-4 btn-gradient font-bold rounded-full"
          >
            {t.backToHome}
          </a>
        </div>
      </div>
    </div>
  );
}
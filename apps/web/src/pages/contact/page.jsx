import LanguageToggle from "@/components/ui/LanguageToggle";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata() {
  const t = await getTranslations("meta.contact");
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("openGraph.title"),
      description: t("openGraph.description"),
      type: "website",
    },
  };
}

export default async function ContactPage(props) {
  const params = props.params
    ? typeof props.params.then === "function"
      ? await props.params
      : props.params
    : {};
  const locale = params?.locale;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const t = (await import(`../../locales/${locale}/contact.json`)).default
    .contactPage;

  return (
    <div
      className="min-h-screen bg-(--ui-surface) text-(--ui-foreground) py-20"
      dir={dir}
      lang={locale}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Language toggle at the very top */}
        <div className="flex justify-end mb-8">
          <LanguageToggle currentLocale={locale} />
        </div>
        {/* Header */}
        <div className="text-center mb-16 animate-fadeIn">
          <h1 className="text-5xl font-bold mb-4">
            <span className="brand-gradient-text">{t.title}</span>
          </h1>
          <p className="text-xl text-(--ui-muted-foreground) max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        {/* Back to Home Button */}
        <div className="mt-10 text-center">
          <a
            href={`/${locale}`}
            className="btn-gradient inline-block px-8 py-4 font-bold rounded-full"
          >
            {t.backHome}
          </a>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="card-glass rounded-3xl p-8 shadow-2xl animate-slideUp">
            <form className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-(--ui-foreground) opacity-80 mb-2"
                >
                  {t.form?.name}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) placeholder:text-(--ui-muted-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20 transition-colors"
                  placeholder={t.form?.namePlaceholder}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-(--ui-foreground) opacity-80 mb-2"
                >
                  {t.form?.email}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) placeholder:text-(--ui-muted-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20 transition-colors"
                  placeholder={t.form?.emailPlaceholder}
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-(--ui-foreground) opacity-80 mb-2"
                >
                  {t.form?.phone}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="w-full px-4 py-3 rounded-xl border-2 border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) placeholder:text-(--ui-muted-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20 transition-colors"
                  placeholder={t.form?.phonePlaceholder}
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-semibold text-(--ui-foreground) opacity-80 mb-2"
                >
                  {t.form?.subject}
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20 transition-colors"
                >
                  <option value="" disabled>
                    {t.form?.subjectPlaceholder}
                  </option>
                  <option value="general">{t.form?.options?.general}</option>
                  <option value="technical">
                    {t.form?.options?.technical}
                  </option>
                  <option value="business">{t.form?.options?.business}</option>
                  <option value="feedback">{t.form?.options?.feedback}</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold text-(--ui-foreground) opacity-80 mb-2"
                >
                  {t.form?.message}
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border-2 border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) placeholder:text-(--ui-muted-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20 transition-colors resize-none"
                  placeholder={t.form?.messagePlaceholder}
                />
              </div>

              <button
                type="submit"
                className="btn-gradient w-full py-4 font-bold rounded-full"
              >
                {t.form?.submit}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div
            className="space-y-8 animate-slideUp"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Info Cards */}
            <div className="card-glass rounded-3xl p-8 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-(--ui-info-bg) border border-(--ui-info-border) text-(--ui-info-foreground)">
                  <svg
                    className="w-6 h-6 text-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-(--ui-foreground) mb-1">
                    {t.info?.emailTitle}
                  </h3>
                  {(t.info?.emails || []).map((email) => (
                    <p key={email} className="text-(--ui-muted-foreground)">
                      {email}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="card-glass rounded-3xl p-8 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-(--ui-danger-bg) border border-(--ui-danger-border) text-(--ui-danger-foreground)">
                  <svg
                    className="w-6 h-6 text-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-(--ui-foreground) mb-1">
                    {t.info?.phoneTitle}
                  </h3>
                  {(t.info?.phones || []).map((phone) => (
                    <p
                      key={phone}
                      className="text-(--ui-muted-foreground)"
                      dir="ltr"
                    >
                      {phone}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="card-glass rounded-3xl p-8 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-(--ui-success-bg) border border-(--ui-success-border) text-(--ui-success-foreground)">
                  <svg
                    className="w-6 h-6 text-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-(--ui-foreground) mb-1">
                    {t.info?.addressTitle}
                  </h3>
                  {(t.info?.addressLines || []).map((line) => (
                    <p key={line} className="text-(--ui-muted-foreground)">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="card-glass rounded-3xl p-8 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-(--ui-warning-bg) border border-(--ui-warning-border) text-(--ui-warning-foreground)">
                  <svg
                    className="w-6 h-6 text-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-(--ui-foreground) mb-1">
                    {t.info?.hoursTitle}
                  </h3>
                  {(t.info?.hours || []).map((line) => (
                    <p key={line} className="text-(--ui-muted-foreground)">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
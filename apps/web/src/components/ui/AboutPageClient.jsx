"use client";
import { useTranslations, useLocale } from "@/lib/compat/intl";
import aboutEn from "@/i18n/locales/en/about.json";
import aboutAr from "@/i18n/locales/ar/about.json";
import Link from "@/lib/compat/Link";
import { usePathname, useRouter } from "@/lib/compat/navigation";

export default function AboutPageClient() {
  const t = useTranslations("about");
  const ui = useTranslations("ui");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  let values = locale === "ar" ? aboutAr.valuesList : aboutEn.valuesList;
  let stats = locale === "ar" ? aboutAr.stats : aboutEn.stats;
  let techList = locale === "ar" ? aboutAr.techList : aboutEn.techList;

  const router = useRouter();
  const pathname = usePathname();
  // Helper to switch locale in the URL
  const toggleLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    // Replace the first segment (locale) in the path
    const segments = pathname.split("/");
    if (segments[1] === "ar" || segments[1] === "en") {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join("/"));
  };

  return (
    <div
      className="min-h-screen bg-white dark:bg-zinc-950"
      dir={dir}
      lang={locale}
    >
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleLocale}
              className="px-5 py-2 rounded-full font-bold btn-gradient text-white shadow focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) transition-all"
            >
              {locale === "ar" ? "EN" : "AR"}
            </button>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center brand-gradient-text">{locale === "ar" ? aboutAr.title : aboutEn.title}</h1>
          <p className="text-lg text-center text-(--ui-muted-foreground) mb-8">{locale === "ar" ? aboutAr.description : aboutEn.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-2">{locale === "ar" ? aboutAr.visionTitle : aboutEn.visionTitle}</h2>
              <p className="text-base text-(--ui-muted-foreground)">{locale === "ar" ? aboutAr.visionDesc : aboutEn.visionDesc}</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">{locale === "ar" ? aboutAr.missionTitle : aboutEn.missionTitle}</h2>
              <p className="text-base text-(--ui-muted-foreground)">{locale === "ar" ? aboutAr.missionDesc : aboutEn.missionDesc}</p>
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">{locale === "ar" ? aboutAr.valuesTitle : aboutEn.valuesTitle}</h2>
          <ul className="mb-8 grid gap-4 md:grid-cols-3">
            {values.map((v, i) => (
              <li key={i} className="p-4 rounded-xl bg-(--ui-surface-2) shadow">
                <h3 className="font-bold mb-1 text-(--color-primary-500)">{v.title}</h3>
                <p className="text-sm text-(--ui-muted-foreground)">{v.desc}</p>
              </li>
            ))}
          </ul>
          <h2 className="text-xl font-bold mb-2">{locale === "ar" ? aboutAr.statsTitle : aboutEn.statsTitle}</h2>
          <div className="flex gap-6 mb-8 justify-center">
            {stats.map((s, i) => (
              <div key={i} className="p-4 rounded-xl bg-(--ui-surface-2) shadow text-center min-w-25">
                <div className="text-2xl font-bold text-(--color-primary-500)">{s.num}</div>
                <div className="text-sm text-(--ui-muted-foreground)">{s.label}</div>
              </div>
            ))}
          </div>
          <h2 className="text-xl font-bold mb-2">{locale === "ar" ? aboutAr.techTitle : aboutEn.techTitle}</h2>
          <p className="mb-4 text-(--ui-muted-foreground)">{locale === "ar" ? aboutAr.techDesc : aboutEn.techDesc}</p>
          <ul className="flex flex-wrap gap-3 mb-8 justify-center">
            {techList.map((tech, i) => (
              <li key={i} className="px-4 py-2 rounded-full bg-(--ui-info) text-(--ui-info-foreground) font-semibold shadow">
                {tech}
              </li>
            ))}
          </ul>
          <div className="text-center mt-8">
            <Link href={locale === "ar" ? "/ar" : "/en"} className="btn-gradient px-8 py-4 rounded-full font-bold text-white">
              {locale === "ar" ? aboutAr.backToHome : aboutEn.backToHome}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
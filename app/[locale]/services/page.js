"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import UnifiedCard from "../../components/ui/UnifiedCard";

export default function ServicesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("services");
  const services = t.raw("list") || [];

  const toggleLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    const segments = pathname.split("/");
    if (segments[1] === "ar" || segments[1] === "en") {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join("/"));
  };

  return (
    <div className="min-h-screen bg-(--ui-surface) text-(--ui-foreground) py-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleLocale}
            className="px-5 py-2 rounded-full font-bold btn-gradient text-white shadow focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) transition-all"
            aria-label={t("languageToggleAria")}
          >
            {locale === "ar" ? "EN" : "AR"}
          </button>
        </div>
        <h1 className="text-4xl font-bold mb-6 text-center brand-gradient-text">
          {t("title")}
        </h1>
        <p className="text-lg text-(--ui-muted-foreground) mb-12 text-center max-w-2xl mx-auto">
          {t("description")}
        </p>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-10 justify-center items-center">
            {services.map((service, idx) => (
              <UnifiedCard
                key={idx}
                className="rounded-3xl p-10 border border-(--ui-border) flex flex-col items-center text-center hover:scale-105 hover:shadow-lg hover:border-(--color-primary-500) transition-all animate-fadeIn min-h-65 min-w-0"
                glass
              >
                {/* يمكنك إضافة أيقونات ثابتة أو حسب idx هنا */}
                <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-(--ui-foreground)">
                  {service.name}
                </h2>
                <p className="text-(--ui-muted-foreground) text-lg md:text-xl font-medium leading-relaxed">
                  {service.desc}
                </p>
              </UnifiedCard>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <Link
            href={`/${locale}`}
            className="inline-block px-6 py-3 rounded-full btn-gradient font-semibold"
          >
            {t("backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

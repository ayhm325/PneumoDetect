"use client";
import { useTranslations } from "@/lib/compat/intl";
import { usePathname, useRouter } from "@/lib/compat/navigation";

export default function LanguageToggle({ currentLocale }) {
  const pathname = usePathname();
  const router = useRouter();
  const ui = useTranslations("ui");

  const handleToggle = () => {
    let target = "en";
    let path = pathname;
    if (pathname.startsWith("/en")) {
      target = "ar";
      path = pathname.slice(3);
    } else if (pathname.startsWith("/ar")) {
      target = "en";
      path = pathname.slice(3);
    } else {
      // fallback: if no prefix, use currentLocale
      target = currentLocale === "ar" ? "en" : "ar";
    }
    if (!path.startsWith("/")) path = "/" + path;
    router.push(`/${target}${path}`);
  };

  return (
    <button
      onClick={handleToggle}
      className="px-5 py-2 rounded-full font-bold btn-gradient text-white shadow focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) transition-all"
      aria-label={
        currentLocale === "ar"
          ? ui("language.switchToEnglish")
          : ui("language.switchToArabic")
      }
    >
      {currentLocale === "ar" ? "EN" : "AR"}
    </button>
  );
}
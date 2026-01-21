

"use client";

import React, { createContext, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

// سياق اللغة (Locale)
export const LocaleContext = createContext();

/**
 * استخرج اللغة من المسار الحالي
 * @param {string} pathname
 * @returns {"en" | "ar"}
 */
function getLocaleFromPathname(pathname) {
  if (typeof pathname !== "string") return "ar"; // افتراضي للعربية
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/ar" || pathname.startsWith("/ar/")) return "ar";
  return "ar";
}

/**
 * استبدل اللغة في المسار الحالي بالمسار الجديد
 * @param {string} pathname
 * @param {"en"|"ar"} newLocale
 */
function replaceLocaleInPath(pathname, newLocale) {
  const safeNewLocale = newLocale === "en" ? "en" : "ar";
  const safePath = typeof pathname === "string" ? pathname : "/";
  const currentLocale = getLocaleFromPathname(safePath);

  // إذا كان المسار يساوي اللغة الحالية فقط
  if (safePath === `/${currentLocale}`) return `/${safeNewLocale}`;

  // إذا كان المسار يبدأ بالـ locale الحالي
  if (safePath.startsWith(`/${currentLocale}/`)) {
    return `/${safeNewLocale}${safePath.slice(currentLocale.length + 1)}`;
  }

  // مسار بدون بادئة لغة
  if (safePath === "/") return `/${safeNewLocale}`;
  return `/${safeNewLocale}${safePath.startsWith("/") ? "" : "/"}${safePath}`;
}

/**
 * مزوّد السياق (Provider) لتغيير اللغة في التطبيق
 */
export function LocaleProvider({ children }) {
  const pathname = usePathname(); // المسار الحالي
  const router = useRouter(); // التنقل
  const currentLocale = getLocaleFromPathname(pathname);

  /**
   * تبديل اللغة بين العربية والإنجليزية
   */
  const toggleLocale = useCallback(() => {
    const newLocale = currentLocale === "en" ? "ar" : "en";
    router.push(replaceLocaleInPath(pathname, newLocale));
  }, [pathname, currentLocale, router]);

  /**
   * تعيين لغة محددة
   * @param {"en"|"ar"} locale
   */
  const setLocale = useCallback(
    (locale) => {
      if (locale === currentLocale) return;
      router.push(replaceLocaleInPath(pathname, locale));
    },
    [pathname, currentLocale, router]
  );

  const value = {
    locale: currentLocale,
    toggleLocale,
    setLocale,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

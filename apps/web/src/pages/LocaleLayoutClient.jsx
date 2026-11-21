"use client";
import { NextIntlClientProvider } from "@/lib/compat/intl";
import { Suspense } from "react";
import { LocaleProvider } from "@/contexts/LocaleContext";

export default function LocaleLayoutClient({ children, locale, messages }) {
  const safeLocale = typeof locale === "string" ? locale : "ar";
  const dir = safeLocale === "ar" ? "rtl" : "ltr";

  return (
    <NextIntlClientProvider locale={safeLocale} messages={messages || {}}>
      <LocaleProvider>
        <Suspense>
          <main id="main-content" dir={dir}>
            {children}
          </main>
        </Suspense>
      </LocaleProvider>
    </NextIntlClientProvider>
  );
}
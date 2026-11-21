import LocaleLayoutClient from "./LocaleLayoutClient";
import fs from "fs";
import path from "path";

function loadAllMessages(locale) {
  const safeLocale = typeof locale === "string" ? locale : "en";
  const localeDir = path.join(process.cwd(), "app", "locales", safeLocale);

  const messages = {};
  try {
    const files = fs.readdirSync(localeDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const ns = path.basename(file, ".json");
      const content = JSON.parse(
        fs.readFileSync(path.join(localeDir, file), "utf-8"),
      );
      messages[ns] = content;
    }
  } catch (e) {
    return {};
  }
  return messages;
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  const messages = loadAllMessages(locale || "en");
  return (
    <LocaleLayoutClient locale={locale} messages={messages}>
      {children}
    </LocaleLayoutClient>
  );
}
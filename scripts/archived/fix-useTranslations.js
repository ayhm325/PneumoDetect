/**
 * Auto-fix useTranslations namespaces for next-intl
 * Permanent solution for MISSING_MESSAGE errors
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SOURCE_DIRS = ["app", "components"];
const LOCALES_DIR = path.join(ROOT, "app", "locales");
const LANGS = ["en", "ar"];

const USE_TRANSLATIONS_REGEX =
  /useTranslations\(\s*(?:['\"`]([\w-]+)['\"`])?\s*\)/g;

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  fs.readdirSync(dir).forEach((f) => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(js|jsx|ts|tsx)$/.test(f)) files.push(p);
  });

  return files;
}

function ensureNamespace(namespace) {
  LANGS.forEach((lang) => {
    const dir = path.join(LOCALES_DIR, lang);
    const file = path.join(dir, `${namespace}.json`);

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(file)) {
      fs.writeFileSync(
        file,
        JSON.stringify({ __AUTO__: "TODO" }, null, 2),
        "utf8",
      );
      console.log(`✅ Created ${lang}/${namespace}.json`);
    }
  });
}

function inferNamespace(filePath) {
  return path
    .basename(filePath)
    .replace(/\.(js|jsx|ts|tsx)$/, "")
    .toLowerCase();
}

// ---- RUN ----

const files = SOURCE_DIRS.flatMap((d) => walk(path.join(ROOT, d)));

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  let modified = false;

  content = content.replace(USE_TRANSLATIONS_REGEX, (match, ns) => {
    if (ns) {
      ensureNamespace(ns);
      return match;
    }

    const inferred = inferNamespace(file);
    ensureNamespace(inferred);
    modified = true;

    console.log(
      `🛠 Fixed missing namespace in ${path.relative(ROOT, file)} → ${inferred}`,
    );

    return `useTranslations("${inferred}")`;
  });

  if (modified) fs.writeFileSync(file, content, "utf8");
});

console.log("🎉 useTranslations audit & fix completed.");

/**
 * Auto-generate missing next-intl namespaces
 * Author: Production-safe utility
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = process.cwd();
const SOURCE_DIRS = ["app", "components"];
const LOCALES_DIR = path.join(PROJECT_ROOT, "app", "locales");
const LANGUAGES = ["en", "ar"];

const NAMESPACE_REGEX = /useTranslations\(\s*['\"`]([\w-]+)['\"`]\s*\)/g;

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, fileList);
    } else if (
      file.endsWith(".js") ||
      file.endsWith(".jsx") ||
      file.endsWith(".ts") ||
      file.endsWith(".tsx")
    ) {
      fileList.push(fullPath);
    }
  });

  return fileList;
}

function extractNamespaces(files) {
  const namespaces = new Set();

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = NAMESPACE_REGEX.exec(content)) !== null) {
      namespaces.add(match[1]);
    }
  });

  return [...namespaces];
}

function ensureNamespaceFiles(namespace) {
  LANGUAGES.forEach((lang) => {
    const langDir = path.join(LOCALES_DIR, lang);
    const filePath = path.join(langDir, `${namespace}.json`);

    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(
        filePath,
        JSON.stringify(
          {
            __TODO__: "TODO",
          },
          null,
          2,
        ),
        "utf8",
      );

      console.log(`✅ Created: ${path.relative(PROJECT_ROOT, filePath)}`);
    }
  });
}

// ---- RUN ----

console.log("🔍 Scanning project for useTranslations(...)");

const files = SOURCE_DIRS.flatMap((dir) => walk(path.join(PROJECT_ROOT, dir)));

const namespaces = extractNamespaces(files);

if (namespaces.length === 0) {
  console.log("⚠ No namespaces found.");
  process.exit(0);
}

console.log(`📦 Found namespaces: ${namespaces.join(", ")}`);

namespaces.forEach(ensureNamespaceFiles);

console.log("🎉 Namespace generation completed successfully.");

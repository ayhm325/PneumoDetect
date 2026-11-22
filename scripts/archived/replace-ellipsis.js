#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "app", "locales");

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) files.push(...walk(p));
    else if (stat.isFile() && p.endsWith(".json")) files.push(p);
  }
  return files;
}

const files = walk(root);
let changed = 0;
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("...")) {
    const updated = content.split("...").join("…");
    fs.writeFileSync(file, updated, "utf8");
    console.log("Updated", path.relative(process.cwd(), file));
    changed++;
  }
}
console.log(`Done. Files updated: ${changed}`);
if (changed > 0) process.exit(0);
else process.exit(0);

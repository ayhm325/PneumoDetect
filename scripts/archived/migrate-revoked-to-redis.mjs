#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import Redis from "ioredis";
import { createHash } from "crypto";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function getRevokedPath() {
  return (
    process.env.REVOKED_TOKENS_PATH ||
    path.join(process.cwd(), "data", "revokedTokens.json")
  );
}

async function backupFile(filePath) {
  try {
    const bak = `${filePath}.${Date.now()}.bak`;
    await fs.copyFile(filePath, bak);
    console.log("Backed up", filePath, "→", bak);
    return bak;
  } catch (e) {
    console.warn("Could not backup file", filePath, e && e.message);
    return null;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run") || args.includes("-n"),
    confirm: args.includes("--confirm") || args.includes("-y"),
    file:
      (args.find((a) => a.startsWith("--file=")) || "").split("=")[1] || null,
  };
}

async function main() {
  const { dryRun, file } = parseArgs();
  const redisUrl = process.env.REDIS_URL;

  if (!dryRun && !redisUrl) {
    console.error(
      "REDIS_URL not set. For actual migration set REDIS_URL to your Redis instance and retry.",
    );
    process.exit(2);
  }

  if (!dryRun && !file && !process.env.DISABLE_CONFIRM_CHECK) {
    // require explicit confirmation flag to avoid accidental writes
    if (!parseArgs().confirm) {
      console.error(
        "This will perform writes to Redis. Re-run with the `--confirm` (or `-y`) flag to proceed, or use `--dry-run` to preview.",
      );
      process.exit(2);
    }
  }

  const p = file || getRevokedPath();
  let txt;
  try {
    txt = await fs.readFile(p, "utf8");
  } catch (e) {
    console.error("Could not read revoked tokens file at", p, e && e.message);
    process.exit(2);
  }

  let arr;
  try {
    arr = JSON.parse(txt || "[]");
  } catch (e) {
    console.error("Invalid JSON in", p, e && e.message);
    process.exit(2);
  }

  const ops = [];
  for (const it of arr) {
    const hash = it.hash || (it.token ? hashToken(it.token) : null);
    if (!hash) continue;
    const key = `revoked:${hash}`;
    let ttlMs = null;
    if (it.exp) {
      ttlMs = Math.max(0, Math.floor(it.exp * 1000 - Date.now()));
      if (ttlMs <= 0) {
        // expired, skip
        continue;
      }
    }
    ops.push({ key, ttlMs });
  }

  if (dryRun) {
    console.log("Dry run: the following Redis keys would be written:");
    for (const op of ops) {
      console.log(`- ${op.key}${op.ttlMs ? ` (TTL ${op.ttlMs} ms)` : ""}`);
    }
    console.log(`Total keys: ${ops.length}`);
    process.exit(0);
  }

  // perform actual migration
  const redis = new Redis(redisUrl);
  let migrated = 0;
  try {
    for (const op of ops) {
      if (op.ttlMs) {
        await redis.set(op.key, "1", "PX", op.ttlMs);
      } else {
        await redis.set(op.key, "1");
      }
      migrated++;
    }
  } finally {
    await redis.quit();
  }

  if (migrated > 0) {
    await backupFile(p);
    console.log(`Migration complete. Migrated ${migrated} entries to Redis.`);
  } else {
    console.log(
      "No entries migrated (no valid hash/token found or all expired).",
    );
  }
}

main().catch((e) => {
  console.error("Migration failed", e && e.message);
  process.exit(1);
});

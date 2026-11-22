#!/usr/bin/env node
import Redis from "ioredis";

const url = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(url);

async function main() {
  try {
    const keys = await redis.keys("revoked:*");
    if (!keys || keys.length === 0) {
      console.log("No revoked keys found");
      return;
    }
    console.log(`Found ${keys.length} revoked keys:`);
    for (const k of keys) {
      const ttl = await redis.pttl(k);
      console.log(`- ${k}  PTTL(ms): ${ttl}`);
    }
  } finally {
    await redis.quit();
  }
}

main().catch((e) => {
  console.error("Error checking revoked keys", e && e.message);
  process.exit(1);
});

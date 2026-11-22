// ===============================================
// Redis-based rate limiter جاهز للإنتاج لـ Next.js / Node.js
// ===============================================
// هذا الملف مسؤول عن:
// 1. تحديد عدد الطلبات المسموح بها لكل مستخدم أو IP خلال فترة زمنية محددة.
// 2. دعم كل من المستخدمين المسجلين (JWT) والمجهولين (anonymous).
// 3. استخدام Redis كسجل مركزي لأداء أفضل.
// 4. fallback إلى كاش في الذاكرة في حال فشل Redis.
// 5. تخصيص حدود مختلفة لـ chat API أو أي endpoint محدد.

// ===============================================
// استيرادات
import Redis from "ioredis";    // Redis client

// ===============================================
// إعدادات البيئة مع قيم افتراضية
const RATE_LIMIT_WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || "") || 60 * 1000; // 1 دقيقة
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "") || 10;
const RATE_LIMIT_CHAT_MAX =
  parseInt(process.env.RATE_LIMIT_CHAT_MAX || "") || 60;
const RATE_LIMIT_REDIS_RETRIES =
  parseInt(process.env.RATE_LIMIT_REDIS_RETRIES || "") || 3;

// ===============================================
// fallback: كاش في الذاكرة (Map)
const MAX_MEMORY_KEYS = 10_000;
const ipHits = new Map();

function pruneMemoryHits(now) {
  for (const [k, timestamps] of ipHits.entries()) {
    const fresh = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (fresh.length === 0) {
      ipHits.delete(k);
    } else if (fresh.length !== timestamps.length) {
      ipHits.set(k, fresh);
    }
  }
  while (ipHits.size >= MAX_MEMORY_KEYS) {
    const oldestKey = ipHits.keys().next().value;
    if (oldestKey === undefined) break;
    ipHits.delete(oldestKey);
  }
}

// ===============================================
// Singleton Redis client
function getRedisClient() {
  if (globalThis.__rl_redis !== undefined) return globalThis.__rl_redis;
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI;
  if (!redisUrl) {
    globalThis.__rl_redis = null;
    return null;
  }
  const client = new Redis(redisUrl, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
    lazyConnect: true,
  });
  globalThis.__rl_redis = client;
  client.on("error", (err) => console.error("Redis client error:", err?.message || err));
  return client;
}

// ===============================================
// FNV-1a hash للمستخدمين المجهولين لتقليل حجم المفتاح
function fnv1aHex(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0).toString(16);
}

// ===============================================
// الدالة الأساسية للتحقق من الحد الأقصى للطلبات
export async function rateLimit(request, options = {}) {
  // تعطيل الـ rate limit أثناء التطوير إذا كان محدد
  if (
    process.env.NODE_ENV === "development" &&
    process.env.RATE_LIMIT_DISABLE_DEV !== "false"
  ) {
    return { limited: false };
  }

  const endpointLabel = String(options?.endpoint || "default")
    .trim()
    .replace(/[^a-zA-Z0-9:_-]/g, "_") || "default";

  // ===============================================
  // إنشاء المفتاح الفريد للمستخدم (فقط من الهوية الموثقة، وليس jwt.decode)
  const verifiedUserId =
    typeof options?.userId === "string" && options.userId.trim()
      ? options.userId.trim()
      : null;

  let key = verifiedUserId ? `rl:${endpointLabel}:user:${verifiedUserId}` : null;

  // مستخدم مجهول: استخدام IP + user-agent
  const ip = request.headers.get("x-forwarded-for") || request.ip || "unknown";
  if (!key) {
    const ua = request.headers.get("user-agent") || "";
    const uaHash = ua ? fnv1aHex(ua).slice(0, 8) : "no-ua";
    key = `rl:${endpointLabel}:anon:${ip}:${uaHash}`;
  }

  // تحديد الحد الأقصى حسب نوع الـ endpoint
  let max = RATE_LIMIT_MAX;
  try {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/chat")) max = RATE_LIMIT_CHAT_MAX;
  } catch (e) {
    console.warn("URL parsing failed, using default max:", e.message);
  }

  // ===============================================
  // محاولة استخدام Redis مع Lua script لزيادة الأداء
  const redis = getRedisClient();
  const luaScript = `
    local v = redis.call('INCR', KEYS[1])
    if tonumber(v) == 1 then
      redis.call('PEXPIRE', KEYS[1], ARGV[1])
    end
    return v
  `;

  // Retry عند فشل Redis
  if (redis) {
    for (let attempt = 1; attempt <= RATE_LIMIT_REDIS_RETRIES; attempt++) {
      try {
        const current = await redis.eval(luaScript, 1, key, RATE_LIMIT_WINDOW_MS);
        const count = Number(current || 0);
        if (count > max) {
          console.info(`Rate limit exceeded for ${key}: ${count} > ${max}`);
          return { limited: true };
        }
        return { limited: false };
      } catch (err) {
        console.warn(
          `Redis attempt ${attempt} failed for key ${key}:`,
          err.message
        );
        if (attempt === RATE_LIMIT_REDIS_RETRIES) {
          console.error("Redis unavailable, falling back to memory store");
        } else {
          await new Promise((res) => setTimeout(res, 50 * attempt)); // backoff صغير
        }
      }
    }
  }

  // ===============================================
  // fallback إلى الذاكرة (best-effort)
  try {
    const now = Date.now();
    if (!ipHits.has(key) && ipHits.size >= MAX_MEMORY_KEYS) {
      pruneMemoryHits(now);
    }
    const existing = ipHits.get(key) || [];
    const recent = existing.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (recent.length >= max) {
      ipHits.set(key, recent);
      console.info(
        `Memory fallback rate limit exceeded for ${key}: ${recent.length} > ${max}`
      );
      return { limited: true };
    }
    recent.push(now);
    ipHits.set(key, recent);
    return { limited: false };
  } catch (memErr) {
    console.error("Memory fallback error:", memErr);
    return { limited: false };
  }
}

// ===============================================
// ملاحظات:
// - key المستخدم: rl:user:<id> للمسجلين، rl:anon:<ip>:<ua> للمجهولين.
// - Lua script في Redis يضمن atomicity وعدد الطلبات ضمن فترة محددة.
// - يستخدم memory fallback فقط إذا فشل Redis.
// - يمكن تخصيص RATE_LIMIT_MAX وRATE_LIMIT_CHAT_MAX من البيئة.
// - يدعم تطوير محلي بدون تقييد الطلبات.
// ===============================================

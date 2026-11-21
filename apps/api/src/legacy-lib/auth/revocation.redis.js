// استيراد مكتبة Redis (ioredis) للتعامل مع خادم Redis
// Redis يُستخدم هنا لتخزين التوكنات الملغية (revoked) بسرعة عالية
import Redis from "ioredis";

// استيراد crypto لإنشاء hash آمن للتوكن
// الهدف: عدم تخزين JWT نفسه داخل Redis لأسباب أمنية
import { createHash } from "crypto";

// إنشاء اتصال مع Redis باستخدام رابط الاتصال من متغيرات البيئة
// مثال: redis://localhost:6379
const redis = new Redis(process.env.REDIS_URL);

// دالة تقوم بعمل hash للتوكن باستخدام SHA-256
// هذا يمنع تخزين التوكن الأصلي ويقلل المخاطر في حال تسريب Redis
function hashToken(token) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

// دالة للتحقق هل التوكن ملغى (revoked) أم لا
export async function isTokenRevoked(token) {
  // إذا لم يوجد توكن، نعتبره غير ملغى
  if (!token) return false;

  // حساب hash للتوكن
  const h = hashToken(token);

  // البحث في Redis عن المفتاح المرتبط بالتوكن
  // المفتاح يكون بالشكل: revoked:<hash>
  const v = await redis.get(`revoked:${h}`);

  // إذا وجد المفتاح → التوكن ملغى
  // إذا لم يوجد → التوكن صالح
  return Boolean(v);
}

// دالة لإضافة توكن إلى قائمة التوكنات الملغية
// exp هو وقت انتهاء التوكن (JWT exp) بالثواني
export async function addRevokedToken(token, exp = null) {
  // إذا لم يوجد توكن، لا نفعل شيئًا
  if (!token) return;

  // حساب hash للتوكن
  const h = hashToken(token);

  // إذا كان وقت الانتهاء موجودًا
  if (exp) {
    // حساب مدة البقاء (TTL) بالميلي ثانية
    // Redis يحتاج TTL بالـ milliseconds
    const ttlMs = Math.max(
      0,
      Math.floor(exp * 1000 - Date.now())
    );

    // إذا كان التوكن لم ينتهِ بعد
    if (ttlMs > 0) {
      // تخزين التوكن الملغى مع TTL
      // PX تعني أن TTL بالميلي ثانية
      await redis.set(`revoked:${h}`, "1", "PX", ttlMs);
      return;
    }
  }

  // في حال عدم وجود exp أو كان التوكن منتهي
  // يتم تخزينه بدون TTL (يبقى حتى يتم حذفه يدويًا)
  await redis.set(`revoked:${h}`, "1");
}

// دالة مخصّصة للاختبارات (Testing)
// تقوم بحذف جميع التوكنات الملغية من Redis
export async function clearRevokedForTest() {
  // استخدام SCAN بدل KEYS لتجنب الضغط على Redis
  // يتم البحث عن كل المفاتيح التي تبدأ بـ revoked:
  const stream = redis.scanStream({
    match: "revoked:*",
    count: 100,
  });

  const keys = [];

  // قراءة المفاتيح على دفعات
  for await (const chunk of stream) {
    if (chunk.length) keys.push(...chunk);
  }

  // إذا وُجدت مفاتيح، يتم حذفها دفعة واحدة
  if (keys.length) {
    await redis.del(...keys);
  }
}

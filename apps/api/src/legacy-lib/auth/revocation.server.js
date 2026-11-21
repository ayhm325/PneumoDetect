// ===============================================
// ملف إدارة التوكنات الملغية (Revoked Tokens)
// يدعم التخزين إما في ملف JSON محلي أو Redis حسب البيئة
// ===============================================

// استيراد مكتبة fs/promises للتعامل مع الملفات بشكل غير متزامن
import fs from "fs/promises";

// استيراد path للتعامل مع المسارات بشكل آمن بين الأنظمة
import path from "path";

// استيراد crypto لإنشاء hash آمن للتوكن
import { createHash } from "crypto";

// ===============================================
// إعداد المسار الافتراضي لملف التوكنات الملغية
// DEFAULT_PATH = ./data/revokedTokens.json بالنسبة لمجلد المشروع
// هذا يحل مشاكل ESM مع Jest ويتيح تشغيل الكود في CommonJS
const DEFAULT_PATH = path.join(process.cwd(), "data", "revokedTokens.json");

// ===============================================
// دالة لتوليد SHA-256 hash للتوكن
// الهدف: عدم تخزين JWT نفسه لأسباب أمنية
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

// ===============================================
// دالة لقراءة التوكنات الملغية من الملف
async function readRevokedFile() {
  try {
    // قراءة الملف كنص
    const txt = await fs.readFile(DEFAULT_PATH, "utf8");

    // تحويل النص إلى مصفوفة JSON
    const arr = JSON.parse(txt || "[]");

    // Migration: دعم البيانات القديمة التي كانت تخزن `token` بدلاً من `hash`
    return arr.map((it) => {
      if (it.hash) return it; // إذا موجود hash، اتركها كما هي
      if (it.token)
        return {
          hash: hashToken(it.token), // إنشاء hash جديد
          revokedAt: it.revokedAt || Date.now(), // تسجيل وقت الإلغاء
          exp: it.exp || null, // وقت انتهاء التوكن
        };
      return it;
    });
  } catch (e) {
    // إذا لم يوجد الملف أو حصل خطأ، نرجع مصفوفة فارغة
    return [];
  }
}

// ===============================================
// دالة لكتابة المصفوفة الجديدة من التوكنات الملغية في الملف
async function writeRevokedFile(list) {
  // إنشاء المجلد إذا لم يكن موجودًا
  await fs.mkdir(path.dirname(DEFAULT_PATH), { recursive: true });

  // كتابة المصفوفة بصيغة JSON مقروءة
  await fs.writeFile(DEFAULT_PATH, JSON.stringify(list, null, 2), "utf8");
}

// ===============================================
// التحقق من وجود REDIS_URL في البيئة
// إذا موجود، نستخدم Redis بدلاً من الملف المحلي
const useRedis = Boolean(process.env.REDIS_URL);

// ===============================================
// دالة لتحميل ملف Redis ديناميكيًا إذا تم تمكين Redis
async function ensureRedisModule() {
  if (!useRedis) return null;
  try {
    // dynamic import لتجنب تحميل ioredis عند عدم الحاجة
    const mod = await import("./revocation.redis.js");
    return mod;
  } catch (e) {
    console.warn(
      "Failed to load Redis revocation module, falling back to file store",
      e && e.message,
    );
    return null;
  }
}

// ===============================================
// دوال التعامل مع الملف فقط (File-based)

// التحقق من حالة التوكن في الملف
async function file_isTokenRevoked(token) {
  if (!token) return false;
  const h = hashToken(token);
  const revoked = await readRevokedFile();
  return Boolean(revoked.find((r) => r.hash === h));
}

// إضافة توكن إلى الملف
async function file_addRevokedToken(token, exp = null) {
  if (!token) return;
  const list = await readRevokedFile();
  const h = hashToken(token);
  // إذا لم يكن موجودًا مسبقًا
  if (!list.find((r) => r.hash === h)) {
    list.push({ hash: h, revokedAt: Date.now(), exp });
    await writeRevokedFile(list);
  }
}

// مسح كل التوكنات الملغية (للاختبارات)
async function file_clearRevokedForTest() {
  await writeRevokedFile([]);
}

// ===============================================
// ===============================================
// الواجهة العامة: اختيار Redis أو الملف تلقائيًا

// التحقق من التوكن الملغى
export async function isTokenRevoked(token) {
  if (!token) return false;
  if (useRedis) {
    const mod = await ensureRedisModule();
    if (mod && mod.isTokenRevoked) return mod.isTokenRevoked(token);
  }
  return file_isTokenRevoked(token);
}

// إضافة توكن ملغى
export async function addRevokedToken(token, exp = null) {
  if (!token) return;
  if (useRedis) {
    const mod = await ensureRedisModule();
    if (mod && mod.addRevokedToken) return mod.addRevokedToken(token, exp);
  }
  return file_addRevokedToken(token, exp);
}

// مسح كل التوكنات الملغية للاختبارات
export async function clearRevokedForTest() {
  if (useRedis) {
    const mod = await ensureRedisModule();
    if (mod && mod.clearRevokedForTest) return mod.clearRevokedForTest();
  }
  return file_clearRevokedForTest();
}

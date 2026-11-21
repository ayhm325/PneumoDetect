// ===============================================
// إدارة JWT Claims (المطالبات) لإصدار والتحقق من JWT
// ===============================================
// هذا الملف مسؤول عن:
// 1. قراءة القيم المهمة من متغيرات البيئة (Issuer, Audience)
// 2. توفير خيارات جاهزة للتحقق (verify) أو للتوقيع (sign) للـ JWT
// 3. الحفاظ على مرونة التعامل مع JWT في السيرفر

// ===============================================
// دالة للحصول على قيمة issuer من البيئة
export function getJwtIssuer() {
  const v = process.env.JWT_ISSUER;          // قراءة متغير البيئة
  const issuer = typeof v === "string" ? v.trim() : ""; // إزالة أي مسافات
  return issuer || undefined;                // إذا كانت فارغة، ترجع undefined
}

// ===============================================
// دالة للحصول على قيمة audience من البيئة
export function getJwtAudience() {
  const v = process.env.JWT_AUDIENCE;        // قراءة متغير البيئة
  const audience = typeof v === "string" ? v.trim() : "";
  return audience || undefined;             // ترجع undefined إذا فارغة
}

// ===============================================
// دالة لإرجاع خيارات التحقق (verify) للـ JWT
export function getJwtVerifyOptions() {
  const issuer = getJwtIssuer();             // جلب issuer
  const audience = getJwtAudience();         // جلب audience
  const opts = {};
  if (issuer) opts.issuer = issuer;          // إذا موجود، أضف إلى الخيارات
  if (audience) opts.audience = audience;    // إذا موجود، أضف إلى الخيارات
  return opts;                               // ترجع كائن الخيارات
}

// ===============================================
// دالة لتطبيق نفس القيم على خيارات التوقيع (sign options)
// تستخدم عند إنشاء JWT جديد
export function applyJwtClaimsToSignOptions(options) {
  const issuer = getJwtIssuer();             // جلب issuer
  const audience = getJwtAudience();         // جلب audience
  if (issuer) options.issuer = issuer;       // تعيين إلى options
  if (audience) options.audience = audience; // تعيين إلى options
  return options;                            // ترجع الكائن المعدل
}

// ===============================================
// ملاحظات:
// - issuer: هو الجهة المصدرة للتوكن، عادة اسم السيرفر أو الدومين.
// - audience: الجهة المستهدفة أو المستلم المسموح له قبول التوكن.
// - هذه القيم تزيد من أمان JWT لأنها تتحقق من مصدر ومستلم التوكن.
// - يمكن استخدامها في jwt.sign و jwt.verify لضمان سلامة التوكن.
// ===============================================

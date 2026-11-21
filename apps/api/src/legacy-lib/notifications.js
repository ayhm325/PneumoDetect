// ===============================================
// دوال مساعدة للتعامل مع الرسائل المترجمة والإشعارات
// ===============================================

/**
 * JSON.stringify آمنة: ترجع null إذا حدث خطأ أثناء التحويل
 * @param {*} value - أي قيمة
 * @returns {string|null}
 */
function safeJsonStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

/**
 * تحويل رسالة متعددة اللغات إلى نص قابل للتخزين
 * @param {string|object} message - رسالة نصية أو كائن بعدة لغات
 * @returns {string} - نص جاهز للتخزين
 */
export function serializeLocalizedMessage(message) {
  if (!message) return "";
  if (typeof message === "string") return message;
  const asJson = safeJsonStringify(message);
  return asJson || String(message);
}

/**
 * استرجاع نص الرسالة المناسب للغة المطلوبة
 * @param {string|object} raw - الرسالة الخام (نص أو JSON)
 * @param {string} locale - اللغة المطلوبة مثل "en" أو "ar"
 * @returns {string} - نص الرسالة المناسب
 */
export function deserializeLocalizedMessage(raw, locale) {
  if (raw == null) return "";
  const str = String(raw);
  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === "object") {
      // محاولة استخدام اللغة المطلوبة
      const byLocale = parsed?.[locale];
      if (typeof byLocale === "string" && byLocale.trim()) return byLocale;
      // fallback: الإنجليزية أو العربية إذا اللغة المطلوبة غير متوفرة
      const fallback = parsed?.en || parsed?.ar;
      if (typeof fallback === "string") return fallback;
    }
  } catch (e) {
    // ليس JSON، نستخدم النص كما هو
  }
  return str;
}

/**
 * تنسيق التاريخ والوقت وفق اللغة/المنطقة
 * @param {Date|string|number} dateInput - التاريخ/الوقت
 * @param {string} locale - اللغة/المنطقة
 * @returns {string} - التاريخ والوقت بصيغة locale
 */
export function formatDateTimeForLocale(dateInput, locale) {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * إنشاء إشعار للمستخدم بطريقة "best-effort"
 * أي يحاول إنشاء الإشعار حتى لو فشل prisma أو حدث خطأ
 * @param {object} prisma - عميل Prisma
 * @param {object} param1 - بيانات الإشعار
 * @param {string|number} param1.userId - المستخدم المستلم
 * @param {string} [param1.type="info"] - نوع الإشعار
 * @param {string|object} param1.message - نص الإشعار أو كائن متعدد اللغات
 * @returns {Promise<object|null>} - الإشعار المنشأ أو null إذا فشل
 */
export async function createNotificationBestEffort(
  prisma,
  { userId, type = "info", message },
) {
  if (!prisma || !userId) return null;
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        message: serializeLocalizedMessage(message), // تخزين كـ JSON أو نص
        isRead: false,
        isDeleted: false,
      },
    });
  } catch (e) {
    console.warn("createNotificationBestEffort failed", e && e.message);
    return null;
  }
}

// ===============================================
// ملاحظات:
// - الدوال تدعم التعامل مع الرسائل متعددة اللغات.
// - formatDateTimeForLocale يستخدم Intl لتنسيق التاريخ/الوقت حسب locale.
// - createNotificationBestEffort يحمي من فشل العمليات ويرجع null عند الخطأ.
// ===============================================

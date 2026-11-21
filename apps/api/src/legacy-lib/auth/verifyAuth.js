// ===============================================
// Security: التحقق المركزي من JWT على الخادم (Server-side JWT auth)
// ===============================================
// هذا الملف مسؤول عن:
// 1. قراءة JWT من الكوكيز HttpOnly فقط
// 2. التحقق من صحة التوقيع (signature) وصلاحية التوكن (expiration)
// 3. التحقق من حالة المستخدم (نشط، محذوف)
// 4. تنفيذ التحكم بالوصول على أساس الدور (RBAC)
// 5. إصدار أخطاء واضحة عند أي مشكلة

// ===============================================
// استيرادات
import jwt from "jsonwebtoken"; // مكتبة JWT للتحقق وفك التوكن
import { getJwtSecret } from "./jwtSecret.js"; // دالة للحصول على السر من البيئة
import { getJwtVerifyOptions } from "./jwtClaims.js"; // خيارات التحقق مثل audience وissuer

// ===============================================
// الدالة الرئيسية للتحقق من JWT
// request      : طلب HTTP يحتوي على الكوكيز
// allowedRoles : مصفوفة أدوار مسموح بها، يمكن تركها فارغة للسماح لكل الأدوار
export function verifyAuth(request, allowedRoles) {
  // الحصول على السر المستخدم لتوقيع JWT
  // لا يوجد fallback، يجب أن يكون محدد في البيئة
  const SECRET = getJwtSecret();

  // قراءة التوكن من كوكيز HttpOnly باسم "token"
  const token = request.cookies.get("token")?.value;

  // إذا لم يوجد توكن، نرمي خطأ واضح
  if (!token)
    throw Object.assign(new Error("Missing token"), { code: "MISSING_TOKEN" });

  let user;
  try {
    // التحقق من صحة التوكن (signature) ووقت الانتهاء (expiration) وخيارات أخرى
    user = jwt.verify(token, SECRET, getJwtVerifyOptions());
  } catch (err) {
    // إذا انتهت صلاحية التوكن
    if (err.name === "TokenExpiredError") {
      throw Object.assign(new Error("Token expired"), {
        code: "EXPIRED_TOKEN",
      });
    }
    // أي خطأ آخر => التوكن غير صالح
    throw Object.assign(new Error("Invalid token"), { code: "INVALID_TOKEN" });
  }

  // التحقق من payload: يجب أن يحتوي على id وrole
  if (!user || !user.id || !user.role) {
    throw Object.assign(new Error("Invalid token payload"), {
      code: "INVALID_TOKEN",
    });
  }

  // التحقق من الدور (Role) إذا تم تحديد allowedRoles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw Object.assign(new Error("Forbidden role"), {
      code: "FORBIDDEN_ROLE",
    });
  }

  // التحقق من أن المستخدم نشط (isActive)
  if (user.isActive === false) {
    throw Object.assign(new Error("Inactive user"), { code: "INACTIVE_USER" });
  }

  // التحقق من أن المستخدم لم يُحذف (isDeleted)
  if (user.isDeleted === true) {
    throw Object.assign(new Error("Deleted user"), { code: "DELETED_USER" });
  }

  // إذا اجتاز كل الشيكات، نرجع معلومات المستخدم الأساسية
  return {
    id: user.id,                  // معرف المستخدم
    role: user.role,              // الدور (Role)
    isActive: user.isActive !== false, // حالة النشاط (افتراضيًا true)
    isDeleted: !!user.isDeleted,       // حالة الحذف (افتراضيًا false)
  };
}

// ===============================================
// ملاحظات أمنية:
// - لا يوجد fallback على السر، يجب أن يكون مضبوطًا في البيئة.
// - فقط HttpOnly cookies مقروءة على السيرفر.
// - يتم رمي أخطاء محددة لكل حالة: مفقود، منتهي الصلاحية، غير صالح، inactive، deleted.
// - مناسب لاستخدامه في middleware أو أي Route يحتاج حماية.
// ===============================================

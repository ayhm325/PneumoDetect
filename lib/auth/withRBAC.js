// ===============================================
// Security: غلاف مركزي للتحكم بالوصول على أساس الدور (RBAC) للـ API routes
// ===============================================
// هذا الملف يقوم بما يلي:
// 1. يضمن أن المستخدم مسجل دخول (JWT صالح)
// 2. يتحقق من الدور المسموح (Role-based access)
// 3. يعيد HTTP status مناسب و JSON response عند أي خطأ
// 4. يسهّل حماية أي Route في Next.js App Router

// ===============================================
// استيرادات
import { NextResponse } from "next/server"; // لإنشاء استجابات HTTP من Next.js
import { verifyAuth } from "./verifyAuth";  // دالة التحقق من JWT وحالة المستخدم

// ===============================================
// الدالة الرئيسية: withRBAC
// handler      : دالة الـ API الأصلية (route handler)
// allowedRoles : مصفوفة الأدوار المسموح بها لهذا الـ route
export function withRBAC(handler, allowedRoles) {
  // إعادة دالة جديدة تتولى التحقق قبل استدعاء handler
  return async function (request, ...args) {
    let user;

    try {
      // التحقق من JWT وحالة المستخدم
      user = verifyAuth(request, allowedRoles);
    } catch (err) {
      // التعامل مع الأخطاء بناءً على الكود الصادر من verifyAuth
      const code = err.code;

      // أخطاء المصادقة العامة: توكن مفقود أو غير صالح أو منتهي الصلاحية
      if (
        code === "MISSING_TOKEN" ||
        code === "INVALID_TOKEN" ||
        code === "EXPIRED_TOKEN"
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // أخطاء الصلاحية: دور غير مسموح، مستخدم غير نشط، مستخدم محذوف
      if (
        code === "FORBIDDEN_ROLE" ||
        code === "INACTIVE_USER" ||
        code === "DELETED_USER"
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // أي خطأ غير متوقع في المصادقة
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 },
      );
    }

    // ===============================================
    // Patch خاص بـ Next.js App Router:
    // بعض dynamic routes تمرر params كـ Promise
    // لذلك يجب فك الـ Promise قبل تمريرها للـ handler
    if (
      args &&
      args.length > 0 &&
      args[0] &&
      typeof args[0].params === "object" &&
      typeof args[0].params.then === "function"
    ) {
      args[0].params = await args[0].params;
    }

    // استدعاء الـ handler الأصلي بعد اجتياز كل الشيكات
    // تمرير request + معلومات المستخدم + باقي الـ args
    return handler(request, user, ...args);
  };
}

// ===============================================
// ملاحظات أمنية:
// - مع هذا الغلاف، أي route يستخدمه سيكون مؤمّن بشكل مركزي.
// - الأخطاء واضحة: 401 للمصادقة، 403 للصلاحية.
// - يدعم Next.js App Router dynamic routes.
// - يمكن إضافة أي Role جديد عبر allowedRoles بسهولة.
// ===============================================

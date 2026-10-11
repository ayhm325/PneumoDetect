// ===============================================
// lib/prismaClient.js
// إنشاء عميل Prisma للتعامل مع قاعدة البيانات
// ===============================================

import { PrismaClient } from "@prisma/client";

// ===============================================
// منع إنشاء أكثر من نسخة Prisma في بيئة التطوير
// لتجنب تحذيرات "Too many clients" في Next.js hot reload
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ?? // استخدم النسخة الموجودة إن وجدت
  new PrismaClient({
    log: ["error", "warn"], // تسجيل الأخطاء والتحذيرات فقط
  });

// في بيئة التطوير، نخزن العميل في globalThis لإعادة الاستخدام
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// ===============================================
// ملاحظات:
// - PrismaClient هو الواجهة الرئيسية للتعامل مع قاعدة البيانات.
// - globalForPrisma يمنع إنشاء نسخ متعددة أثناء إعادة التحميل الساخن (Hot Reload).
// - يمكن تعديل log لتسجيل info أو query إذا أردنا تتبع الاستعلامات.
// ===============================================

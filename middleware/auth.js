// ===============================================
// middleware/jwtAuth.js
// دوال وسيطة لحماية مسارات API باستخدام JWT
// ===============================================

import jwt from "jsonwebtoken";
import { getJwtSecret } from "../lib/auth/jwtSecret.js";
import { getJwtVerifyOptions } from "../lib/auth/jwtClaims.js";

// جلب السر من البيئة (ضروري للتحقق من JWT)
const SECRET = getJwtSecret();

/**
 * دالة وسيطة (middleware) للتحقق من JWT في مسارات API التقليدية
 * @param {*} req  - طلب HTTP
 * @param {*} res  - استجابة HTTP
 * @param {*} next - تابع الاستمرار إذا تم التحقق
 */
export function authenticateToken(req, res, next) {
  // قراءة الهيدر Authorization
  const authHeader = req.headers["authorization"];
  // استخراج التوكن بصيغة Bearer <token>
  const token = authHeader && authHeader.split(" ")[1];
  
  // إذا لم يوجد توكن، إعادة خطأ 401
  if (!token) return res.status(401).json({ error: "Token required" });

  // التحقق من صحة التوكن باستخدام السر وخيارات التحقق
  jwt.verify(token, SECRET, getJwtVerifyOptions(), (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    // إضافة معلومات المستخدم إلى الطلب لتمريرها للمسار
    req.user = user;
    next();
  });
}

/*
ملاحظات:
1. هذا الحماية خاصة بمسارات API التقليدية (pages/api) وليست App Router.
2. في Next.js الحديثة، يمكن حماية كل المسارات عبر middleware.js في جذر المشروع.
3. يتم التحقق من التوكن وإرجاع رسائل خطأ واضحة عند عدم وجود التوكن أو عند انتهاء صلاحيته أو كونه غير صالح.
4. يمكن دمج هذه الدالة مع RBAC للتحقق من أدوار المستخدم.
*/

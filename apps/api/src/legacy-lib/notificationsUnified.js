// ===============================================
// lib/notificationsUnified.js
// دالة موحدة لإرسال الإشعارات عبر WebSocket وقاعدة البيانات
// ===============================================
import { createNotificationBestEffort } from "./notifications.js";
import { sendNotificationWS } from "./ws/notificationWS.js";

/**
 * إرسال إشعار موحد للمستخدم
 * @param {object} prisma - عميل Prisma
 * @param {object} options
 * @param {string|number} options.userId - معرف المستخدم
 * @param {string|object} options.message - نص أو كائن متعدد اللغات
 * @param {string} [options.type="info"] - نوع الإشعار
 * @param {boolean} [options.viaWS=true] - إرسال عبر WebSocket
 * @param {boolean} [options.viaDB=true] - تسجيل في قاعدة البيانات
 * @param {object} [options.wsPayload] - بيانات إضافية للـ WS
 * @returns {Promise<object|null>} - الإشعار المنشأ أو null
 */
export async function sendUnifiedNotification(prisma, {
  userId,
  message,
  type = "info",
  viaWS = true,
  viaDB = true,
  wsPayload = null,
}) {
  let dbResult = null;
  if (viaDB) {
    dbResult = await createNotificationBestEffort(prisma, { userId, type, message });
  }
  if (viaWS) {
    sendNotificationWS(userId, wsPayload || { type, message });
  }
  return dbResult;
}

// ===============================================
// ملاحظات:
// - استخدم sendUnifiedNotification في كل مكان تحتاج فيه إشعار.
// - يمكنك تخصيص wsPayload إذا أردت إرسال بيانات إضافية عبر WebSocket.
// ===============================================

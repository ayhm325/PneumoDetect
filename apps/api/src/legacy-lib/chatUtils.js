/**
 * تنظيف النص من أي HTML ومسافات زائدة
 * @param {string} txt
 * @returns {string}
 */
export function sanitizeText(txt = "") {
  const stripped = txt.replace(/<[^>]*>/g, "");
  return stripped.trim();
}

/**
 * التحقق إذا كان يجب إرسال إشعار رسالة جديدة
 * @param {object} prismaClient
 * @param {object} param1
 * @returns {Promise<boolean>}
 */
export async function shouldSendChatNotification(prismaClient, { userId, chatId }) {
  try {
    const existing = await prismaClient.notification.findFirst({
      where: {
        userId,
        isDeleted: false,
        isRead: false,
        AND: [
          { message: { contains: '"kind":"chat_message"' } },
          { message: { contains: `"chatId":"${chatId}"` } },
        ],
      },
      select: { id: true },
    });
    return !existing;
  } catch {
    return true;
  }
}

import { AppError } from "../../lib/errors/appError";
import type { ChatPatientRepository } from "../../repositories/chat/chatPatientRepository";
import { sanitizeText, shouldSendChatNotification } from "../../../lib/chatUtils.js";
import { prisma } from "../../db/prisma";

const MAX_MESSAGE_LENGTH = 500;

export interface ChatMessageService {
  listMessages(input: {
    userId: string;
    role: string;
    chatId: string;
  }): Promise<{ messages: Array<Record<string, unknown>> }>;
  sendMessage(input: {
    userId: string;
    role: string;
    chatId: string;
    text?: string;
    clientKey?: string;
    fileUrl?: string;
    mimeType?: string;
    fileName?: string;
  }): Promise<{ message: Record<string, unknown>; existing?: boolean }>;
}

async function resolveChatAccess(
  repository: ChatPatientRepository,
  input: { userId: string; role: string; chatId: string },
): Promise<{ chat: Record<string, unknown> }> {
  const userId = String(input.userId || "").trim();
  const role = String(input.role || "").trim();
  const chatId = String(input.chatId || "").trim();

  if (!chatId) {
    throw new AppError({
      code: "validation_error",
      message: "missing_chat_id",
      statusCode: 400,
    });
  }

  if (!userId) {
    throw new AppError({
      code: "unauthenticated",
      message: "unauthenticated",
      statusCode: 401,
    });
  }

  const chat = await repository.findChatById(chatId);
  if (!chat) {
    throw new AppError({
      code: "not_found",
      message: "chat_not_found",
      statusCode: 404,
    });
  }

  if (role === "doctor") {
    if (String((chat as { doctorId?: string }).doctorId || "") !== userId) {
      throw new AppError({
        code: "forbidden",
        message: "forbidden",
        statusCode: 403,
      });
    }
  } else if (role === "patient") {
    const patient = await repository.findPatientByUserId(userId);
    const patientId = String((patient as { id?: string } | null)?.id || "");
    if (!patientId || patientId !== String((chat as { patientId?: string }).patientId || "")) {
      throw new AppError({
        code: "forbidden",
        message: "forbidden",
        statusCode: 403,
      });
    }
  } else if (role === "admin") {
  } else {
    throw new AppError({
      code: "forbidden",
      message: "forbidden",
      statusCode: 403,
    });
  }

  return { chat };
}

export function createChatMessageService(deps: {
  chatPatientRepository: ChatPatientRepository;
}): ChatMessageService {
  return {
    async listMessages(input) {
      const chatId = String(input.chatId || "").trim();
      const role = String(input.role || "").trim();
      const userId = String(input.userId || "").trim();
      const { chat } = await resolveChatAccess(deps.chatPatientRepository, { userId, role, chatId });

      if (role === "doctor" || role === "patient") {
        const notifyUserId =
          role === "patient"
            ? String((await deps.chatPatientRepository.findPatientByUserId(userId) as { userId?: string } | null)?.userId || "").trim() || userId
            : userId;

        const unreadFrom = role === "doctor" ? "patient" : "doctor";

        await Promise.allSettled([
          deps.chatPatientRepository.markUnreadNotificationsAsRead(notifyUserId, chatId),
          deps.chatPatientRepository.markMessagesAsRead(chatId, unreadFrom),
        ]);
      }

      const recent = await deps.chatPatientRepository.listRecentMessages(chatId, 50);
      return { messages: [...recent].reverse() };
    },

    async sendMessage(input) {
      const chatId = String(input.chatId || "").trim();
      const role = String(input.role || "").trim();
      const userId = String(input.userId || "").trim();
      const { chat } = await resolveChatAccess(deps.chatPatientRepository, { userId, role, chatId });

      const text = sanitizeText(String(input.text || ""));
      const fileUrl = String(input.fileUrl || "").trim();
      const mimeType = String(input.mimeType || "").trim();
      const fileName = String(input.fileName || "").trim();
      const clientKey = String(input.clientKey || "").trim();

      if (!text && !fileUrl) {
        throw new AppError({
          code: "validation_error",
          message: "empty_message",
          statusCode: 400,
        });
      }

      if (text.length > MAX_MESSAGE_LENGTH) {
        throw new AppError({
          code: "validation_error",
          message: "message_too_long",
          statusCode: 400,
        });
      }

      const sender = role === "doctor" ? "doctor" : "patient";

      if (clientKey) {
        const existing = await deps.chatPatientRepository.findMessageByClientKey(chatId, clientKey);
        if (existing) {
          return { message: existing, existing: true };
        }
      }

      const message = await deps.chatPatientRepository.createMessage({
        chatId,
        sender,
        text: text || null,
        clientKey: clientKey || null,
        fileUrl: fileUrl || null,
        mimeType: mimeType || null,
        fileName: fileName || null,
      });

      await deps.chatPatientRepository.touchChat(chatId);

      const { sendUnifiedNotification } = await import("../../../lib/notificationsUnified.js");

      if (sender === "doctor") {
        const patientUserId = await deps.chatPatientRepository.findPatientUserIdByPatientId(
          String((chat as { patientId?: string }).patientId || ""),
        );
        if (patientUserId) {
          const shouldSend = await shouldSendChatNotification(prisma, {
            userId: patientUserId,
            chatId,
          });
          if (shouldSend) {
            await sendUnifiedNotification(prisma, {
              userId: patientUserId,
              type: "info",
              message: {
                ar: "لديك رسالة جديدة من طبيبك.",
                en: "You have a new message from your doctor.",
                meta: { kind: "chat_message", chatId },
              },
              viaWS: true,
              viaDB: true,
              wsPayload: { kind: "chat_message", chatId },
            });
          }
        }
      } else if (sender === "patient") {
        const doctorUserId = await deps.chatPatientRepository.findDoctorUserIdByDoctorId(
          String((chat as { doctorId?: string }).doctorId || ""),
        );
        if (doctorUserId) {
          const shouldSend = await shouldSendChatNotification(prisma, {
            userId: doctorUserId,
            chatId,
          });
          if (shouldSend) {
            await sendUnifiedNotification(prisma, {
              userId: doctorUserId,
              type: "info",
              message: {
                ar: "لديك رسالة جديدة من مريضك.",
                en: "You have a new message from your patient.",
                meta: { kind: "chat_message", chatId },
              },
              viaWS: true,
              viaDB: true,
              wsPayload: { kind: "chat_message", chatId },
            });
          }
        }
      }

      return { message };
    },
  };
}

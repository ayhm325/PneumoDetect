import { AppError } from "../../lib/errors/appError";
import type { ChatPatientRepository } from "../../repositories/chat/chatPatientRepository";
import type { ChatRealtimePublisher } from "./chatRealtimePublisher";
import { sanitizeText, shouldSendChatNotification } from "../../legacy-lib/chatUtils.js";
import { prisma } from "../../db/prisma";

const MAX_MESSAGE_LENGTH = 500;

export interface ChatMessageService {
  listMessages(input: {
    userId: string;
    role: string;
    chatId: string;
    limit?: number;
    before?: string;
  }): Promise<{ messages: Array<Record<string, unknown>>; hasMore?: boolean }>;
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
  markMessagesStatus(input: {
    userId: string;
    role: string;
    messageIds: string[];
    targetStatus: "delivered" | "read";
  }): Promise<{ updated: Array<{ id: string; chatId: string; status: "delivered" | "read" }> }>;
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
  realtimePublisher?: ChatRealtimePublisher;
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

      const limit = Math.min(Math.max(Number(input.limit) || 50, 1), 100);
      const before = typeof input.before === "string" && input.before.trim() ? input.before.trim() : undefined;
      const recent = await deps.chatPatientRepository.listRecentMessages(chatId, limit + 1, before);
      const hasMore = recent.length > limit;
      const page = hasMore ? recent.slice(0, limit) : recent;
      return { messages: [...page].reverse(), hasMore };
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

      if (role !== "doctor" && role !== "patient") {
        throw new AppError({
          code: "forbidden",
          message: "forbidden",
          statusCode: 403,
        });
      }

      if (fileUrl) {
        const isSafeUrl =
          fileUrl.startsWith("/uploads/") ||
          fileUrl.startsWith("https://") ||
          fileUrl.startsWith("http://");
        if (!isSafeUrl) {
          throw new AppError({
            code: "validation_error",
            message: "invalid_file_url",
            statusCode: 400,
          });
        }
      }

      const sender = role;

      if (clientKey) {
        const existing = await deps.chatPatientRepository.findMessageByClientKey(chatId, clientKey);
        if (existing) {
          return { message: existing, existing: true };
        }
      }

      let message: Record<string, unknown>;
      try {
        message = await deps.chatPatientRepository.createMessage({
          chatId,
          sender,
          text: text || null,
          clientKey: clientKey || null,
          fileUrl: fileUrl || null,
          mimeType: mimeType || null,
          fileName: fileName || null,
        });
      } catch (err) {
        if (clientKey) {
          const existingAfterRace = await deps.chatPatientRepository.findMessageByClientKey(chatId, clientKey);
          if (existingAfterRace) {
            return { message: existingAfterRace, existing: true };
          }
        }
        throw err;
      }

      await deps.chatPatientRepository.touchChat(chatId);

      // Resolve recipient user ID for user-scoped conversation updates & notifications
      let recipientUserId: string | null = null;
      try {
        recipientUserId =
          sender === "doctor"
            ? await deps.chatPatientRepository.findPatientUserIdByPatientId(
                String((chat as { patientId?: string }).patientId || ""),
              )
            : await deps.chatPatientRepository.findDoctorUserIdByDoctorId(
                String((chat as { doctorId?: string }).doctorId || ""),
              );
      } catch (lookupErr) {
        console.error("chatMessageService: recipient lookup failed", lookupErr);
      }

      // Publish real-time message event immediately after DB commit (before optional notifications)
      try {
        deps.realtimePublisher?.publishNewMessage({
          chatId,
          message,
          senderUserId: userId,
          recipientUserId,
        });
      } catch (publishErr) {
        console.error("chatMessageService: realtime publish failed", publishErr);
      }

      // Best-effort notification side effect: must never fail or suppress persisted message delivery
      if (recipientUserId) {
        try {
          const { sendUnifiedNotification } = await import("../../legacy-lib/notificationsUnified.js");
          const shouldSend = await shouldSendChatNotification(prisma, {
            userId: recipientUserId,
            chatId,
          });
          if (shouldSend) {
            await sendUnifiedNotification(prisma, {
              userId: recipientUserId,
              type: "info",
              message:
                sender === "doctor"
                  ? {
                      ar: "لديك رسالة جديدة من طبيبك.",
                      en: "You have a new message from your doctor.",
                      meta: { kind: "chat_message", chatId },
                    }
                  : {
                      ar: "لديك رسالة جديدة من مريضك.",
                      en: "You have a new message from your patient.",
                      meta: { kind: "chat_message", chatId },
                    },
              viaWS: true,
              viaDB: true,
              wsPayload: { kind: "chat_message", chatId },
            });
          }
        } catch (notifErr) {
          console.error("chatMessageService: notification side-effect failed", notifErr);
        }
      }

      return { message };
    },

    async markMessagesStatus(input) {
      const userId = String(input.userId || "").trim();
      const role = String(input.role || "").trim();
      if (role !== "doctor" && role !== "patient") {
        throw new AppError({
          code: "forbidden",
          message: "forbidden",
          statusCode: 403,
        });
      }

      const ids = Array.from(
        new Set((input.messageIds || []).map((id) => String(id || "").trim()).filter(Boolean)),
      ).slice(0, 100);
      if (!userId || ids.length === 0) return { updated: [] };

      const rows = await deps.chatPatientRepository.findMessagesByIds(ids);
      if (rows.length === 0) return { updated: [] };

      const userSenderType = role;
      const authorizedChatIds = new Set<string>();
      const uniqueChatIds = Array.from(new Set(rows.map((r) => r.chatId)));

      await Promise.all(
        uniqueChatIds.map(async (cid) => {
          try {
            await resolveChatAccess(deps.chatPatientRepository, { userId, role, chatId: cid });
            authorizedChatIds.add(cid);
          } catch {
            // Unauthorized chatId is excluded
          }
        }),
      );

      const eligible = rows.filter((msg) => {
        if (!authorizedChatIds.has(msg.chatId)) return false;
        if (msg.sender === userSenderType) return false;
        if (input.targetStatus === "delivered") return msg.status === "sent";
        return msg.status !== "read";
      });

      if (eligible.length === 0) return { updated: [] };

      const eligibleIds = eligible.map((m) => m.id);
      await deps.chatPatientRepository.markMessagesStatusByIds(eligibleIds, input.targetStatus);

      const timestamp = new Date();
      for (const m of eligible) {
        try {
          deps.realtimePublisher?.publishMessageUpdate({
            chatId: m.chatId,
            id: m.id,
            status: input.targetStatus,
          });
          if (input.targetStatus === "read") {
            deps.realtimePublisher?.publishMessageRead({
              chatId: m.chatId,
              messageId: m.id,
              userId,
              timestamp,
            });
          }
        } catch (pubErr) {
          console.error("chatMessageService: status publish failed", pubErr);
        }
      }

      return {
        updated: eligible.map((m) => ({
          id: m.id,
          chatId: m.chatId,
          status: input.targetStatus,
        })),
      };
    },
  };
}

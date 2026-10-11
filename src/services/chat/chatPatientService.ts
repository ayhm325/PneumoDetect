import { AppError } from "../../lib/errors/appError";
import { prisma } from "../../db/prisma";
import type { ChatPatientRepository } from "../../repositories/chat/chatPatientRepository";
import { sendUnifiedNotification } from "../../../lib/notificationsUnified.js";

async function sendChatCreatedNotification(input: {
  userId: string;
  chatId: string;
  patientName?: string | null;
}) {
  await sendUnifiedNotification(prisma, {
    userId: input.userId,
    type: "info",
    message: {
      ar: `تم بدء محادثة جديدة${input.patientName ? ` من المريض ${input.patientName}` : ""}.`,
      en: `A new chat was started${input.patientName ? ` by patient ${input.patientName}` : ""}.`,
      meta: { kind: "chat_created", chatId: input.chatId },
    },
    viaWS: true,
    viaDB: true,
    wsPayload: { kind: "chat_created", chatId: input.chatId },
  });
}

export interface ChatPatientService {
  listChatsForPatientUser(userId: string): Promise<{ chats: Array<Record<string, unknown>> }>;
  listChatsForDoctorUser(userId: string): Promise<{ chats: Array<Record<string, unknown>> }>;
  listChatsForAdminUser(userId: string): Promise<{ chats: Array<Record<string, unknown>> }>;
  deleteChatById(input: { userId: string; role: string; chatId: string }): Promise<{ success: true }>;
  createOrGetChat(input: {
    userId: string;
    role: string;
    patientId?: string;
  }): Promise<{ chat: Record<string, unknown>; created: boolean }>;
}

export function createChatPatientService(deps: {
  chatPatientRepository: ChatPatientRepository;
}): ChatPatientService {
  return {
    async listChatsForPatientUser(userId) {
      const normalizedUserId = String(userId || "").trim();
      if (!normalizedUserId) {
        throw new AppError({
          code: "unauthenticated",
          message: "unauthenticated",
          statusCode: 401,
        });
      }

      const patient = await deps.chatPatientRepository.findActivePatientByUserId(normalizedUserId);
      if (!patient) {
        throw new AppError({
          code: "not_found",
          message: "patient_not_found",
          statusCode: 404,
        });
      }

      const patientId = String((patient as { id?: string }).id || "");
      const chats = await deps.chatPatientRepository.listChatsForPatient(patientId);
      const chatIds = chats.map((chat) => String(chat.id || "")).filter(Boolean);

      const grouped = await deps.chatPatientRepository.groupUnreadDoctorMessages(chatIds);
      const unreadByChatId = new Map(grouped.map((row) => [row.chatId, row.count]));

      const chatsWithUnread = chats.map((chat) => ({
        ...chat,
        unreadCount: unreadByChatId.get(String(chat.id || "")) || 0,
      }));

      return { chats: chatsWithUnread };
    },

    async listChatsForDoctorUser(userId) {
      const normalizedUserId = String(userId || "").trim();
      if (!normalizedUserId) {
        throw new AppError({
          code: "unauthenticated",
          message: "unauthenticated",
          statusCode: 401,
        });
      }

      const patients = await deps.chatPatientRepository.listActivePatientsForDoctor(normalizedUserId);

      const chats: Array<{ id: string; patient: Record<string, unknown> }> = [];

      for (const patient of patients) {
        const patientId = String(patient.id || "").trim();
        const patientUserId = String((patient.userId as string | undefined) || "").trim();
        if (!patientId) continue;

        const existing = await deps.chatPatientRepository.findChatByDoctorAndPatient(
          normalizedUserId,
          patientId,
        );
        const chat =
          existing ||
          (await deps.chatPatientRepository.createChat({
            doctorId: normalizedUserId,
            patientId,
          }));

        if (!existing && patientUserId) {
          await sendChatCreatedNotification({
            userId: patientUserId,
            chatId: String(chat.id || ""),
          });
        }

        chats.push({ id: String(chat.id || ""), patient });
      }

      const extraChats = await deps.chatPatientRepository.listDoctorChatsWithPatient(normalizedUserId);
      for (const chat of extraChats) {
        const chatId = String(chat.id || "").trim();
        const patient = (chat.patient as Record<string, unknown> | undefined) || null;
        if (!chatId || !patient) continue;
        if (String(patient.status || "") !== "active") continue;
        if (!chats.find((item) => item.id === chatId)) {
          chats.push({ id: chatId, patient });
        }
      }

      const chatIds = chats.map((chat) => chat.id);
      const lastMessages = await deps.chatPatientRepository.listLastMessagesForChats(chatIds);
      const unreadGrouped = await deps.chatPatientRepository.groupUnreadPatientMessages(chatIds);

      const unreadByChatId = new Map(unreadGrouped.map((row) => [row.chatId, row.count]));
      const lastByChatId = new Map(
        lastMessages.map((message) => [String(message.chatId || ""), message]),
      );

      const chatsWithDetails = chats.map((chat) => {
        const lastMessage = lastByChatId.get(chat.id);
        return {
          id: chat.id,
          patient: chat.patient,
          messages: lastMessage ? [lastMessage] : [],
          unreadCount: unreadByChatId.get(chat.id) || 0,
        };
      });

      chatsWithDetails.sort((a, b) => {
        const aCreatedAt =
          ((a.messages[0] as { createdAt?: string | Date } | undefined)?.createdAt) || null;
        const bCreatedAt =
          ((b.messages[0] as { createdAt?: string | Date } | undefined)?.createdAt) || null;
        const aTime = aCreatedAt ? new Date(aCreatedAt).getTime() : 0;
        const bTime = bCreatedAt ? new Date(bCreatedAt).getTime() : 0;
        return bTime - aTime;
      });

      return { chats: chatsWithDetails as Array<Record<string, unknown>> };
    },

    async listChatsForAdminUser(userId) {
      const normalizedUserId = String(userId || "").trim();
      if (!normalizedUserId) {
        throw new AppError({
          code: "unauthenticated",
          message: "unauthenticated",
          statusCode: 401,
        });
      }

      const chats = await deps.chatPatientRepository.listChatsForAdmin();
      const chatIds = chats.map((chat) => String(chat.id || "")).filter(Boolean);
      const unreadGrouped = await deps.chatPatientRepository.groupUnreadAllMessages(chatIds);
      const unreadByChatId = new Map(unreadGrouped.map((row) => [row.chatId, row.count]));

      const chatsWithUnread = chats.map((chat) => ({
        ...chat,
        unreadCount: unreadByChatId.get(String(chat.id || "")) || 0,
      }));

      return { chats: chatsWithUnread };
    },

    async deleteChatById(input) {
      const normalizedUserId = String(input.userId || "").trim();
      const normalizedRole = String(input.role || "").trim();
      const normalizedChatId = String(input.chatId || "").trim();

      if (!normalizedChatId) {
        throw new AppError({
          code: "validation_error",
          message: "missing_chat_id",
          statusCode: 400,
        });
      }

      if (!normalizedUserId) {
        throw new AppError({
          code: "unauthenticated",
          message: "unauthenticated",
          statusCode: 401,
        });
      }

      const chat = await deps.chatPatientRepository.findChatById(normalizedChatId);
      if (!chat) {
        throw new AppError({
          code: "not_found",
          message: "chat_not_found",
          statusCode: 404,
        });
      }

      const chatDoctorId = String((chat as { doctorId?: string }).doctorId || "");
      const chatPatientId = String((chat as { patientId?: string }).patientId || "");

      if (normalizedRole === "doctor") {
        if (chatDoctorId !== normalizedUserId) {
          throw new AppError({
            code: "forbidden",
            message: "forbidden_doctor",
            statusCode: 403,
          });
        }
      } else if (normalizedRole === "patient") {
        const patient = await deps.chatPatientRepository.findPatientByUserId(normalizedUserId);
        if (!patient || String((patient as { id?: string }).id || "") !== chatPatientId) {
          throw new AppError({
            code: "forbidden",
            message: "forbidden_patient",
            statusCode: 403,
          });
        }
      } else if (normalizedRole === "admin") {
      } else {
        throw new AppError({
          code: "forbidden",
          message: "forbidden_role",
          statusCode: 403,
        });
      }

      await deps.chatPatientRepository.deleteChatWithMessages(normalizedChatId);
      return { success: true as const };
    },

    async createOrGetChat(input) {
      const userId = String(input.userId || "").trim();
      const role = String(input.role || "").trim();
      if (!userId) {
        throw new AppError({
          code: "unauthenticated",
          message: "unauthenticated",
          statusCode: 401,
        });
      }

      if (role === "doctor") {
        const patientId = String(input.patientId || "").trim();
        if (!patientId) {
          throw new AppError({
            code: "validation_error",
            message: "missing_patient_id",
            statusCode: 400,
          });
        }

        const patient = await deps.chatPatientRepository.findPatientById(patientId);
        const patientUserId = String((patient as { userId?: string | null } | null)?.userId || "").trim();
        const patientName =
          ((patient as { fullName?: string | null } | null)?.fullName || null) ?? null;
        const isPatientActive =
          (patient as { user?: { isActive?: boolean } } | null)?.user?.isActive !== false;

        if (!patientUserId || !isPatientActive) {
          throw new AppError({
            code: "validation_error",
            message: "patient_inactive",
            statusCode: 400,
          });
        }

        const existing = await deps.chatPatientRepository.findChatByDoctorAndPatient(userId, patientId);
        const chat = existing || (await deps.chatPatientRepository.createChat({ doctorId: userId, patientId }));
        const created = !existing;

        if (created) {
          await sendChatCreatedNotification({
            userId: patientUserId,
            chatId: String(chat.id),
          });
          await sendChatCreatedNotification({
            userId: userId,
            chatId: String(chat.id),
            patientName,
          });
        }

        return { chat, created };
      }

      if (role === "patient") {
        const patient = await deps.chatPatientRepository.findActivePatientByUserId(userId);
        if (!patient) {
          throw new AppError({
            code: "not_found",
            message: "patient_not_found",
            statusCode: 404,
          });
        }

        const patientId = String((patient as { id?: string }).id || "");
        const doctorId = String((patient as { doctorId?: string | null }).doctorId || "").trim();
        const patientName =
          ((patient as { fullName?: string | null }).fullName || null) ?? null;

        if (!doctorId) {
          throw new AppError({
            code: "validation_error",
            message: "no_doctor_linked",
            statusCode: 400,
          });
        }

        const existing = await deps.chatPatientRepository.findChatByDoctorAndPatient(doctorId, patientId);
        const chat = existing || (await deps.chatPatientRepository.createChat({ doctorId, patientId }));
        const created = !existing;

        if (created) {
          await sendChatCreatedNotification({
            userId,
            chatId: String(chat.id),
          });
          await sendChatCreatedNotification({
            userId: doctorId,
            chatId: String(chat.id),
            patientName,
          });
        }

        return { chat, created };
      }

      throw new AppError({
        code: "forbidden",
        message: "forbidden",
        statusCode: 403,
      });
    },
  };
}

import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

export interface ChatPatientRepository {
  findActivePatientByUserId(userId: string): Promise<Record<string, unknown> | null>;
  findPatientById(patientId: string): Promise<Record<string, unknown> | null>;
  findPatientByUserId(userId: string): Promise<Record<string, unknown> | null>;
  listActivePatientsForDoctor(doctorId: string): Promise<Array<Record<string, unknown>>>;
  findChatById(chatId: string): Promise<Record<string, unknown> | null>;
  findChatByDoctorAndPatient(doctorId: string, patientId: string): Promise<Record<string, unknown> | null>;
  createChat(input: { doctorId: string; patientId: string }): Promise<Record<string, unknown>>;
  listChatsForPatient(patientId: string): Promise<Array<Record<string, unknown>>>;
  listDoctorChatsWithPatient(doctorId: string): Promise<Array<Record<string, unknown>>>;
  listChatsForAdmin(): Promise<Array<Record<string, unknown>>>;
  listLastMessagesForChats(chatIds: string[]): Promise<Array<Record<string, unknown>>>;
  groupUnreadDoctorMessages(chatIds: string[]): Promise<Array<{ chatId: string; count: number }>>;
  groupUnreadPatientMessages(chatIds: string[]): Promise<Array<{ chatId: string; count: number }>>;
  groupUnreadAllMessages(chatIds: string[]): Promise<Array<{ chatId: string; count: number }>>;
  listRecentMessages(chatId: string, take: number): Promise<Array<Record<string, unknown>>>;
  markUnreadNotificationsAsRead(userId: string, chatId: string): Promise<void>;
  markMessagesAsRead(chatId: string, sender: "doctor" | "patient"): Promise<void>;
  findMessageByClientKey(chatId: string, clientKey: string): Promise<Record<string, unknown> | null>;
  createMessage(input: {
    chatId: string;
    sender: "doctor" | "patient";
    text?: string | null;
    clientKey?: string | null;
    fileUrl?: string | null;
    mimeType?: string | null;
    fileName?: string | null;
  }): Promise<Record<string, unknown>>;
  touchChat(chatId: string): Promise<void>;
  findPatientUserIdByPatientId(patientId: string): Promise<string | null>;
  findDoctorUserIdByDoctorId(doctorId: string): Promise<string | null>;
  deleteChatWithMessages(chatId: string): Promise<void>;
}

export function createChatPatientRepository(
  db: PrismaClientLike = prisma,
): ChatPatientRepository {
  return {
    async findActivePatientByUserId(userId) {
      try {
        const patient = await db.patient.findUnique({
          where: { userId },
          include: { user: true },
        });
        if (!patient || !patient.user?.isActive) return null;
        return patient as unknown as Record<string, unknown>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load patient by user",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findPatientById(patientId) {
      try {
        const patient = await db.patient.findUnique({
          where: { id: patientId },
          select: {
            id: true,
            userId: true,
            doctorId: true,
            fullName: true,
            user: { select: { isActive: true } },
          },
        });
        return patient as unknown as Record<string, unknown> | null;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load patient",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findPatientByUserId(userId) {
      try {
        const patient = await db.patient.findUnique({
          where: { userId },
          select: {
            id: true,
            userId: true,
            doctorId: true,
            fullName: true,
            user: { select: { isActive: true } },
          },
        });
        return patient as unknown as Record<string, unknown> | null;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load patient by user",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listActivePatientsForDoctor(doctorId) {
      try {
        const patients = await db.patient.findMany({
          where: { doctorId, status: "active" },
          select: {
            id: true,
            userId: true,
            fullName: true,
            email: true,
            status: true,
          },
        });

        return patients as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load doctor active patients",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findChatByDoctorAndPatient(doctorId, patientId) {
      try {
        const chat = await db.chat.findFirst({ where: { doctorId, patientId } });
        return chat as unknown as Record<string, unknown> | null;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load chat",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findChatById(chatId) {
      try {
        const chat = await db.chat.findUnique({ where: { id: chatId } });
        return chat as unknown as Record<string, unknown> | null;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load chat by id",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createChat(input) {
      try {
        const chat = await db.chat.create({
          data: {
            doctorId: input.doctorId,
            patientId: input.patientId,
          },
        });
        return chat as unknown as Record<string, unknown>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create chat",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listChatsForPatient(patientId) {
      try {
        const chats = await db.chat.findMany({
          where: { patientId },
          include: {
            doctor: {
              select: {
                userId: true,
                phone: true,
                clinic: true,
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    isActive: true,
                    role: true,
                    createdAt: true,
                  },
                },
              },
            },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          orderBy: { updatedAt: "desc" },
        });
        return chats as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list patient chats",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listDoctorChatsWithPatient(doctorId) {
      try {
        const chats = await db.chat.findMany({
          where: { doctorId },
          include: {
            patient: {
              select: {
                id: true,
                userId: true,
                fullName: true,
                email: true,
                status: true,
              },
            },
          },
        });

        return chats as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load doctor chats",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listChatsForAdmin() {
      try {
        const chats = await db.chat.findMany({
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            updatedAt: true,
            patient: {
              select: {
                id: true,
                userId: true,
                fullName: true,
                email: true,
                status: true,
              },
            },
            doctor: {
              select: {
                userId: true,
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                sender: true,
                text: true,
                fileUrl: true,
                mimeType: true,
                fileName: true,
                status: true,
                createdAt: true,
              },
            },
          },
        });

        return chats as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list admin chats",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listLastMessagesForChats(chatIds) {
      if (!Array.isArray(chatIds) || chatIds.length === 0) return [];

      try {
        const messages = await db.message.findMany({
          where: { chatId: { in: chatIds } },
          orderBy: [{ chatId: "asc" }, { createdAt: "desc" }],
          distinct: ["chatId"],
          take: chatIds.length,
        });

        return messages as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load last chat messages",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async groupUnreadDoctorMessages(chatIds) {
      if (!Array.isArray(chatIds) || chatIds.length === 0) return [];

      try {
        const grouped = await db.message.groupBy({
          by: ["chatId"],
          where: {
            chatId: { in: chatIds },
            sender: "doctor",
            status: { not: "read" },
          },
          _count: { _all: true },
        });

        return grouped.map((row: { chatId: string; _count?: { _all?: number } }) => ({
          chatId: row.chatId,
          count: row._count?._all || 0,
        }));
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to aggregate unread counts",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async groupUnreadPatientMessages(chatIds) {
      if (!Array.isArray(chatIds) || chatIds.length === 0) return [];

      try {
        const grouped = await db.message.groupBy({
          by: ["chatId"],
          where: {
            chatId: { in: chatIds },
            sender: "patient",
            status: { not: "read" },
          },
          _count: { _all: true },
        });

        return grouped.map((row: { chatId: string; _count?: { _all?: number } }) => ({
          chatId: row.chatId,
          count: row._count?._all || 0,
        }));
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to aggregate doctor unread counts",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async groupUnreadAllMessages(chatIds) {
      if (!Array.isArray(chatIds) || chatIds.length === 0) return [];

      try {
        const grouped = await db.message.groupBy({
          by: ["chatId"],
          where: {
            chatId: { in: chatIds },
            status: { not: "read" },
          },
          _count: { _all: true },
        });

        return grouped.map((row: { chatId: string; _count?: { _all?: number } }) => ({
          chatId: row.chatId,
          count: row._count?._all || 0,
        }));
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to aggregate unread counts for admin",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async deleteChatWithMessages(chatId) {
      try {
        await db.$transaction([
          db.message.deleteMany({ where: { chatId } }),
          db.chat.delete({ where: { id: chatId } }),
        ]);
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to delete chat",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listRecentMessages(chatId, take) {
      try {
        const messages = await db.message.findMany({
          where: { chatId },
          orderBy: { createdAt: "desc" },
          take,
          skip: 0,
        });

        return messages as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load chat messages",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async markUnreadNotificationsAsRead(userId, chatId) {
      try {
        await db.notification.updateMany({
          where: {
            userId,
            isDeleted: false,
            isRead: false,
            AND: [
              { message: { contains: '"kind":"chat_message"' } },
              { message: { contains: `"chatId":"${chatId}"` } },
            ],
          },
          data: { isRead: true },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to mark chat notifications as read",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async markMessagesAsRead(chatId, sender) {
      try {
        await db.message.updateMany({
          where: {
            chatId,
            sender,
            status: { not: "read" },
          },
          data: { status: "read" },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to mark messages as read",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findMessageByClientKey(chatId, clientKey) {
      try {
        const message = await db.message.findFirst({
          where: { chatId, clientKey },
        });
        return message as unknown as Record<string, unknown> | null;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find message by client key",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createMessage(input) {
      try {
        const message = await db.message.create({
          data: {
            chatId: input.chatId,
            sender: input.sender,
            text: input.text || null,
            clientKey: input.clientKey || null,
            fileUrl: input.fileUrl || null,
            mimeType: input.mimeType || null,
            fileName: input.fileName || null,
          },
        });

        return message as unknown as Record<string, unknown>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create chat message",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async touchChat(chatId) {
      try {
        await db.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update chat timestamp",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findPatientUserIdByPatientId(patientId) {
      try {
        const patient = await db.patient.findUnique({
          where: { id: patientId },
          select: { userId: true },
        });
        return patient?.userId || null;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find patient user id",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findDoctorUserIdByDoctorId(doctorId) {
      try {
        const doctor = await db.doctor.findUnique({
          where: { userId: doctorId },
          select: { userId: true },
        });
        return doctor?.userId || null;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find doctor user id",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}

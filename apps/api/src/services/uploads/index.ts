import { AppError } from "../../lib/errors/appError";
import { createChatPatientRepository } from "../../repositories/chat/chatPatientRepository";
import { createUploadService } from "./uploadService";

const chatPatientRepository = createChatPatientRepository();

export const uploadService = createUploadService({
  async verifyChatAccess({ chatId, userId, role }) {
    if (!userId) {
      throw new AppError({
        code: "unauthenticated",
        message: "unauthenticated",
        statusCode: 401,
      });
    }
    const chat = await chatPatientRepository.findChatById(chatId);
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
      return;
    }
    if (role === "patient") {
      const patient = await chatPatientRepository.findPatientByUserId(userId);
      const patientId = String((patient as { id?: string } | null)?.id || "");
      if (!patientId || patientId !== String((chat as { patientId?: string }).patientId || "")) {
        throw new AppError({
          code: "forbidden",
          message: "forbidden",
          statusCode: 403,
        });
      }
      return;
    }
    throw new AppError({
      code: "forbidden",
      message: "forbidden",
      statusCode: 403,
    });
  },
});

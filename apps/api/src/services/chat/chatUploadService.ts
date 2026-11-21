import { writeFile } from "fs/promises";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { AppError } from "../../lib/errors/appError";
import type { ChatPatientRepository } from "../../repositories/chat/chatPatientRepository";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "bmp",
  "webp",
  "pdf",
  "txt",
  "doc",
  "docx",
]);

export interface ChatUploadService {
  uploadFile(input: {
    userId: string;
    role: string;
    chatId: string;
    file: File | null;
  }): Promise<{ url: string }>;
}

async function ensureChatAccess(
  repository: ChatPatientRepository,
  input: { userId: string; role: string; chatId: string },
): Promise<void> {
  const userId = String(input.userId || "").trim();
  const role = String(input.role || "").trim();
  const chatId = String(input.chatId || "").trim();

  if (!chatId) {
    throw new AppError({ code: "validation_error", message: "missing_chat_id", statusCode: 400 });
  }

  if (!userId) {
    throw new AppError({ code: "unauthenticated", message: "unauthenticated", statusCode: 401 });
  }

  const chat = await repository.findChatById(chatId);
  if (!chat) {
    throw new AppError({ code: "not_found", message: "chat_not_found", statusCode: 404 });
  }

  if (role === "doctor") {
    if (String((chat as { doctorId?: string }).doctorId || "") !== userId) {
      throw new AppError({ code: "forbidden", message: "forbidden", statusCode: 403 });
    }
    return;
  }

  if (role === "patient") {
    const patient = await repository.findPatientByUserId(userId);
    const patientId = String((patient as { id?: string } | null)?.id || "");
    if (!patientId || patientId !== String((chat as { patientId?: string }).patientId || "")) {
      throw new AppError({ code: "forbidden", message: "forbidden", statusCode: 403 });
    }
    return;
  }

  if (role !== "admin") {
    throw new AppError({ code: "forbidden", message: "forbidden", statusCode: 403 });
  }
}

export function createChatUploadService(deps: {
  chatPatientRepository: ChatPatientRepository;
}): ChatUploadService {
  return {
    async uploadFile(input) {
      const chatId = String(input.chatId || "").trim();
      await ensureChatAccess(deps.chatPatientRepository, {
        userId: input.userId,
        role: input.role,
        chatId,
      });

      const file = input.file;
      if (!file || typeof file.arrayBuffer !== "function") {
        throw new AppError({ code: "validation_error", message: "upload_missing_file", statusCode: 400 });
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        throw new AppError({ code: "validation_error", message: "upload_file_too_large", statusCode: 400 });
      }

      const extRaw = String(file.name || "").split(".").pop() || "";
      const ext = extRaw.toLowerCase();
      if (!ext || !ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
        throw new AppError({ code: "validation_error", message: "upload_invalid_file_type", statusCode: 400 });
      }

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const safeFileName = `${chatId}_${randomUUID()}.${ext}`;
      const filePath = path.join(uploadDir, safeFileName);
      const arrayBuffer = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(arrayBuffer));

      return { url: `/uploads/${safeFileName}` };
    },
  };
}

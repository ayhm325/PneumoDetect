import { Router } from "express";
import fs from "fs/promises";
import formidable from "formidable";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth.js";
import { withRateLimit } from "../middleware/rateLimit.js";
import { chatMessageService, chatPatientService, chatUploadService } from "../services/chat/index.js";
import { AppError } from "../lib/errors/appError.js";
import { env } from "../config/env.js";

export const chatRouter = Router();

chatRouter.get(
  "/chat/patient",
  requireAuth,
  requireRole("patient"),
  withRateLimit("GET /api/chat/patient"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await chatPatientService.listChatsForPatientUser(req.auth!.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

chatRouter.post(
  "/chat/patient",
  requireAuth,
  requireRole("patient"),
  withRateLimit("POST /api/chat/patient"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await chatPatientService.createOrGetChat({
        userId: req.auth!.user.id,
        role: "patient",
        patientId: req.body?.patientId,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

chatRouter.get(
  "/chat/doctor",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("GET /api/chat/doctor"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await chatPatientService.listChatsForDoctorUser(req.auth!.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

chatRouter.post(
  "/chat/doctor",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("POST /api/chat/doctor"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await chatPatientService.createOrGetChat({
        userId: req.auth!.user.id,
        role: "doctor",
        patientId: req.body?.patientId,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

chatRouter.get(
  "/chat/admin",
  requireAuth,
  requireRole("admin"),
  withRateLimit("GET /api/chat/admin"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await chatPatientService.listChatsForAdminUser(req.auth!.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

chatRouter.delete(
  "/chat/:chatId",
  requireAuth,
  withRateLimit("DELETE /api/chat/:chatId"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await chatPatientService.deleteChatById({
        userId: req.auth!.user.id,
        role: req.auth!.user.role || "",
        chatId: String(req.params.chatId),
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

chatRouter.get(
  "/chat/:chatId/messages",
  requireAuth,
  withRateLimit("GET /api/chat/:chatId/messages"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const before = typeof req.query.before === "string" ? req.query.before : undefined;
      const result = await chatMessageService.listMessages({
        userId: req.auth!.user.id,
        role: req.auth!.user.role || "",
        chatId: String(req.params.chatId),
        limit,
        before,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

chatRouter.post(
  "/chat/:chatId/messages",
  requireAuth,
  withRateLimit("POST /api/chat/:chatId/messages"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await chatMessageService.sendMessage({
        userId: req.auth!.user.id,
        role: req.auth!.user.role,
        chatId: String(req.params.chatId),
        ...(req.body || {}),
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

chatRouter.post(
  "/chat/:chatId/upload",
  requireAuth,
  withRateLimit("POST /api/chat/:chatId/upload"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const contentType = String(req.headers["content-type"] || "");
      if (!contentType.toLowerCase().includes("multipart/form-data")) {
        throw new AppError({
          code: "validation_error",
          message: "invalid_content_type",
          statusCode: 400,
        });
      }

      const form = formidable({
        maxFileSize: env.maxUploadBytes,
        allowEmptyFiles: false,
      });

      const [, files] = await form.parse(req);
      const uploaded = files.file?.[0];
      let fileAdapter: {
        name: string;
        type: string;
        size: number;
        arrayBuffer: () => Promise<ArrayBuffer>;
      } | null = null;

      if (uploaded) {
        const buffer = await fs.readFile(uploaded.filepath);
        await fs.unlink(uploaded.filepath).catch(() => {});
        fileAdapter = {
          name: uploaded.originalFilename || "upload",
          type: uploaded.mimetype || "application/octet-stream",
          size: buffer.byteLength,
          arrayBuffer: async () =>
            buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        };
      }

      const result = await chatUploadService.uploadFile({
        userId: req.auth!.user.id,
        role: req.auth!.user.role || "",
        chatId: String(req.params.chatId),
        file: fileAdapter as unknown as File | null,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

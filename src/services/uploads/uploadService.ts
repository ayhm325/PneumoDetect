import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "../../lib/errors/appError";

const MAX_FILE_SIZE = Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024);
const ALLOWED_EXT = [".png", ".jpg", ".jpeg", ".gif", ".pdf", ".doc", ".docx"];
const MAX_FILENAME_LENGTH = 180;

function sanitizeFilename(filename: string): string {
  return String(filename || "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

function makeLocalKey(filename: string): string {
  const safeName = sanitizeFilename(filename);
  const timestamp = Date.now();
  return `uploads/${timestamp}-${safeName}`;
}

function extAllowed(name: string): boolean {
  const target = String(name || "").toLowerCase();
  return ALLOWED_EXT.some((ext) => target.endsWith(ext));
}

function guessContentType(name: string): string {
  const ext = String(name || "").toLowerCase();
  if (ext.endsWith(".png")) return "image/png";
  if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) return "image/jpeg";
  if (ext.endsWith(".webp")) return "image/webp";
  if (ext.endsWith(".gif")) return "image/gif";
  if (ext.endsWith(".pdf")) return "application/pdf";
  if (ext.endsWith(".doc")) return "application/msword";
  if (ext.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/octet-stream";
}

function ensureUploadsPath(relPath: string): string {
  const normalized = path.normalize(relPath).replace(/^([./\\])+/, "");
  const normalizedSlashes = normalized.replace(/\\/g, "/");
  if (!normalizedSlashes.startsWith("uploads/")) {
    throw new AppError({
      code: "validation_error",
      message: "invalid_upload_path",
      statusCode: 400,
    });
  }
  return normalizedSlashes;
}

export interface UploadService {
  initUpload(input: {
    chatId?: string;
    filename?: string;
    contentType?: string;
  }): Promise<Record<string, unknown>>;
  completeUpload(input: {
    chatId?: string;
    key?: string;
    filename?: string;
    provider?: string;
    bucket?: string;
    region?: string;
  }): Promise<Record<string, unknown>>;
  saveLocalUpload(input: { relativePath?: string; data: ArrayBuffer }): Promise<{ ok: true }>;
}

export function createUploadService(): UploadService {
  return {
    async initUpload(input) {
      const chatId = String(input.chatId || "").trim();
      const filename = String(input.filename || "").trim();
      const contentType = String(input.contentType || "").trim();
      const safeFilename = sanitizeFilename(filename);

      if (!chatId || !filename) {
        throw new AppError({
          code: "validation_error",
          message: "invalid_parameters",
          statusCode: 400,
        });
      }

      if (!safeFilename || !extAllowed(safeFilename)) {
        throw new AppError({
          code: "invalid_file_type",
          message: "invalid_file_type",
          statusCode: 400,
        });
      }

      if (safeFilename.length > MAX_FILENAME_LENGTH) {
        throw new AppError({
          code: "validation_error",
          message: "filename_too_long",
          statusCode: 400,
        });
      }

      const S3_BUCKET = process.env.S3_BUCKET;
      const AWS_REGION = process.env.AWS_REGION || "us-east-1";

      if (S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        const key = `uploads/${Date.now()}-${safeFilename}`;
        const client = new S3Client({ region: AWS_REGION });
        const cmd = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          ContentType: contentType || "application/octet-stream",
        });
        const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: 900 });
        return { uploadUrl, key, provider: "s3", bucket: S3_BUCKET };
      }

      const key = makeLocalKey(safeFilename);
      const absDir = path.join(process.cwd(), "public", path.dirname(key));
      await fs.promises.mkdir(absDir, { recursive: true });
      const uploadUrl = `/api/uploads/local-upload?path=${encodeURIComponent(key)}`;
      return { uploadUrl, key, provider: "local" };
    },

    async completeUpload(input) {
      const chatId = String(input.chatId || "").trim();
      const key = String(input.key || "").trim();
      const filename = String(input.filename || "").trim();
      const provider = String(input.provider || "")
        .trim()
        .toLowerCase();

      if (!chatId || !key) {
        throw new AppError({
          code: "validation_error",
          message: "invalid_parameters",
          statusCode: 400,
        });
      }

      if (provider && provider !== "s3" && provider !== "local") {
        throw new AppError({
          code: "validation_error",
          message: "invalid_provider",
          statusCode: 400,
        });
      }

      if (provider === "s3") {
        const bucketToUse = String(input.bucket || process.env.S3_BUCKET || "").trim();
        const regionToUse = String(input.region || process.env.AWS_REGION || "us-east-1").trim();
        if (!bucketToUse) {
          throw new AppError({
            code: "server_error",
            message: "missing_bucket_config",
            statusCode: 500,
          });
        }

        try {
          const client = new S3Client({ region: regionToUse });
          const head = await client.send(
            new HeadObjectCommand({ Bucket: bucketToUse, Key: key }),
          );

          const size = head.ContentLength || 0;
          const contentType = head.ContentType || "";

          if (size > MAX_FILE_SIZE) {
            throw new AppError({ code: "file_too_large", message: "file_too_large", statusCode: 400 });
          }

          if (
            !extAllowed(key) &&
            !contentType.startsWith("image/") &&
            !contentType.includes("pdf") &&
            !contentType.includes("msword") &&
            !contentType.includes("officedocument")
          ) {
            throw new AppError({
              code: "invalid_file_type",
              message: "invalid_file_type",
              statusCode: 400,
            });
          }

          const url = `https://${bucketToUse}.s3.${regionToUse}.amazonaws.com/${encodeURI(key)}`;
          return {
            url,
            key,
            provider: "s3",
            contentType,
            filename: filename || key,
          };
        } catch (error) {
          if (error instanceof AppError) throw error;
          throw new AppError({
            code: "server_error",
            message: "s3_error",
            statusCode: 500,
            cause: error,
          });
        }
      }

      const safeKey = ensureUploadsPath(key);
      const abs = path.join(process.cwd(), "public", safeKey);
      const stat = await fs.promises.stat(abs).catch(() => null);
      if (!stat) {
        throw new AppError({
          code: "validation_error",
          message: "uploaded_file_not_found",
          statusCode: 400,
        });
      }

      if (stat.size > MAX_FILE_SIZE) {
        throw new AppError({ code: "file_too_large", message: "file_too_large", statusCode: 400 });
      }

      if (!extAllowed(filename || safeKey)) {
        throw new AppError({
          code: "invalid_file_type",
          message: "invalid_file_type",
          statusCode: 400,
        });
      }

      return {
        url: `/${safeKey}`,
        key: safeKey,
        provider: "local",
        contentType: guessContentType(filename || safeKey),
        filename: filename || safeKey,
      };
    },

    async saveLocalUpload(input) {
      const relPath = ensureUploadsPath(String(input.relativePath || "").trim());
      if (!extAllowed(relPath)) {
        throw new AppError({
          code: "invalid_file_type",
          message: "invalid_file_type",
          statusCode: 400,
        });
      }

      if (input.data.byteLength === 0) {
        throw new AppError({
          code: "validation_error",
          message: "empty_file",
          statusCode: 400,
        });
      }

      if (input.data.byteLength > MAX_FILE_SIZE) {
        throw new AppError({
          code: "file_too_large",
          message: "file_too_large",
          statusCode: 400,
        });
      }

      const abs = path.join(process.cwd(), "public", relPath);
      await fs.promises.mkdir(path.dirname(abs), { recursive: true });
      await fs.promises.writeFile(abs, Buffer.from(input.data));
      return { ok: true as const };
    },
  };
}

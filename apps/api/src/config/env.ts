import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { z } from "zod";

const cwd = process.cwd();
const repoRoot = fs.existsSync(path.join(cwd, "apps")) ? cwd : path.resolve(cwd, "../..");
// Load root .env if present (monorepo root) or local apps/api/.env
dotenv.config({ path: path.resolve(repoRoot, ".env") });
dotenv.config({ path: path.resolve(repoRoot, "apps/api/.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL environment variable is required"),
  JWT_SECRET: z.string().default(""),
  CORS_ORIGINS: z.string().default("http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"),
  PY_MODEL_URL: z.string().url("PY_MODEL_URL must be a valid URL").default("http://127.0.0.1:8000/predict"),
  REDIS_URL: z.string().default(""),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().max(100 * 1024 * 1024).default(10 * 1024 * 1024),
});

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.API_PORT || process.env.SOCKET_PORT || process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  corsOrigins: (
    process.env.CORS_ORIGINS ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  pyModelUrl: process.env.PY_MODEL_URL || "http://127.0.0.1:8000/predict",
  redisUrl: process.env.REDIS_URL || "",
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024),
};

export function validateEnv(): void {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.API_PORT || process.env.SOCKET_PORT || process.env.PORT || 4000,
    DATABASE_URL: process.env.DATABASE_URL || "",
    JWT_SECRET: process.env.JWT_SECRET || "",
    CORS_ORIGINS:
      process.env.CORS_ORIGINS ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
    PY_MODEL_URL: process.env.PY_MODEL_URL || "http://127.0.0.1:8000/predict",
    REDIS_URL: process.env.REDIS_URL || "",
    MAX_UPLOAD_BYTES: process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  if (parsed.data.NODE_ENV === "production" && parsed.data.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
}

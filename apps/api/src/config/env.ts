import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load root .env if present (monorepo root) or local apps/api/.env
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

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
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  if (env.isProd && (!env.jwtSecret || env.jwtSecret.length < 32)) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
}

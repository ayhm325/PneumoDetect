import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { healthRouter } from "../routes/health.routes.js";
import { authRouter } from "../routes/auth.routes.js";
import { analysisRouter } from "../routes/analysis.routes.js";
import { patientRouter } from "../routes/patient.routes.js";
import { doctorRouter } from "../routes/doctor.routes.js";
import { adminRouter } from "../routes/admin.routes.js";
import { chatRouter } from "../routes/chat.routes.js";
import { uploadsRouter } from "../routes/uploads.routes.js";
import { cronRouter } from "../routes/cron.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Requested-With"],
      exposedHeaders: ["X-Unread-Count"],
    }),
  );

  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Serve static uploaded files & generated AI heatmaps (authenticated)
  app.use("/uploads", requireAuth, express.static(path.join(repoRoot, "public", "uploads")));
  app.use(
    "/static/heatmaps",
    requireAuth,
    express.static(path.join(repoRoot, "python_model", "static", "heatmaps")),
  );

  app.use("/api", healthRouter);
  app.use("/api", authRouter);
  app.use("/api", analysisRouter);
  app.use("/api", patientRouter);
  app.use("/api", doctorRouter);
  app.use("/api", adminRouter);
  app.use("/api", chatRouter);
  app.use("/api", uploadsRouter);
  app.use("/api", cronRouter);

  app.use(errorHandler);

  return app;
}

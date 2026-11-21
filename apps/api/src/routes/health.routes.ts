import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  let aiOk = false;
  try {
    const aiHealthUrl = env.pyModelUrl.replace(/\/predict\/?$/, "/docs");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch(aiHealthUrl, { signal: controller.signal });
    clearTimeout(timer);
    aiOk = resp.ok || resp.status === 307;
  } catch {
    aiOk = false;
  }

  res.status(dbOk ? 200 : 503).json({
    status: dbOk && aiOk ? "ok" : dbOk ? "degraded" : "error",
    service: "pneumodetect-api",
    dependencies: {
      database: dbOk ? "ok" : "error",
      ai: aiOk ? "ok" : "unavailable",
    },
    timestamp: new Date().toISOString(),
  });
});

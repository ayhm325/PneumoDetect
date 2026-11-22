import http from "http";
import { env, validateEnv } from "./config/env.js";
import { createApp } from "./bootstrap/createApp.js";
import { setupSocket } from "./socket/setupSocket.js";
import { prisma } from "./db/prisma.js";

validateEnv();

const app = createApp();
const server = http.createServer(app);
const io = setupSocket(server);

server.listen(env.port, () => {
  console.log(`PneumoDetect Express API + Socket.IO listening on http://localhost:${env.port}`);
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  try {
    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await prisma.$disconnect();
    const rlRedis = (globalThis as { __rl_redis?: { quit?: () => Promise<unknown> } | null }).__rl_redis;
    if (rlRedis && typeof rlRedis.quit === "function") {
      await rlRedis.quit().catch(() => undefined);
    }
    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

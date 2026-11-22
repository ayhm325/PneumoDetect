import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

function checkPort(port = 5432, host = "127.0.0.1", timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const cleanup = () => {
      if (!settled) {
        settled = true;
        socket.destroy();
      }
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      cleanup();
      resolve(true);
    });
    socket.once("timeout", () => {
      cleanup();
      resolve(false);
    });
    socket.once("error", () => {
      cleanup();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function main() {
  const isUp = await checkPort(5432);
  if (isUp) {
    console.log("[DB] PostgreSQL is running on port 5432.");
    process.exit(0);
  }

  console.log("[DB] PostgreSQL is not responding on port 5432. Checking local installation...");

  const localAppData = process.env.LOCALAPPDATA || "";
  const candidates = [
    path.join(localAppData, "Programs", "PostgreSQL17", "pgsql", "bin", "postgres.exe"),
    path.join("C:", "Program Files", "PostgreSQL", "17", "bin", "postgres.exe"),
    path.join("C:", "Program Files", "PostgreSQL", "16", "bin", "postgres.exe"),
  ];

  let postgresExe = null;
  let dataDir = null;

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      postgresExe = candidate;
      const localData = path.join(path.dirname(path.dirname(candidate)), "data");
      const subData = path.join(path.dirname(candidate), "..", "data");
      if (fs.existsSync(localData)) dataDir = localData;
      else if (fs.existsSync(subData)) dataDir = subData;
      else {
        // Look in LOCALAPPDATA data dir
        const appDataPg = path.join(localAppData, "Programs", "PostgreSQL17", "data");
        if (fs.existsSync(appDataPg)) dataDir = appDataPg;
      }
      break;
    }
  }

  if (!postgresExe || !dataDir) {
    console.warn(
      "[DB] Notice: PostgreSQL service not detected on port 5432. Continuing (app will use dev fallback if configured)...",
    );
    process.exit(0);
  }

  console.log(`[DB] Launching PostgreSQL background daemon: ${postgresExe} -D ${dataDir}`);
  const child = spawn(postgresExe, ["-D", dataDir], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();

  // Wait up to 5 seconds for PostgreSQL to become ready
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await checkPort(5432)) {
      console.log("[DB] PostgreSQL is now online and accepting connections.");
      process.exit(0);
    }
  }

  console.warn("[DB] PostgreSQL was started but port 5432 did not respond in time.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[DB] Error checking PostgreSQL:", err);
  process.exit(0); // Do not block server launch
});

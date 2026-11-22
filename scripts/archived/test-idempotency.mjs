#!/usr/bin/env node
// Quick idempotency test script: POST twice with same clientKey and verify DB.
import fetch from "node-fetch";
import prisma from "../lib/prismaClient.js";
import { execSync } from "child_process";

async function main() {
  const chatId = process.env.TEST_CHAT_ID || "test-chat-1";
  const clientKey = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const url = `http://localhost:3000/api/chat/${chatId}/messages`;
  console.log("Posting to", url, "with clientKey", clientKey);

  const body = { text: "Idempotent test message", clientKey };

  // Determine auth token: prefer DEV_TOKEN env, else attempt to generate via TEST_USER_EMAIL
  let token = process.env.DEV_TOKEN;
  if (!token && process.env.TEST_USER_EMAIL) {
    try {
      const out = execSync(
        `node scripts/create-dev-token.mjs ${process.env.TEST_USER_EMAIL}`,
        { encoding: "utf8" },
      ).trim();
      token = out;
      console.log("Generated token for", process.env.TEST_USER_EMAIL);
    } catch (e) {
      console.warn(
        "Failed to generate dev token from TEST_USER_EMAIL",
        e.message,
      );
    }
  }

  for (let i = 0; i < 2; i++) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers,
        credentials: "include",
      });
      const data = await res.json();
      console.log("POST", i + 1, "status", res.status, "body", data);
    } catch (e) {
      console.error("POST error", e);
    }
  }

  // wait a moment then query DB
  await new Promise((r) => setTimeout(r, 500));
  const msgs = await prisma.message.findMany({ where: { chatId, clientKey } });
  console.log("DB matches for chatId+clientKey:", msgs.length);
  if (msgs.length > 0) console.log("Sample:", msgs[0]);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});

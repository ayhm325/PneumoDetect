#!/usr/bin/env node
// Script to create the partial unique index safely via Prisma DB connection.
import prisma from "../lib/prismaClient.js";

const sql = `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_message_chat_clientkey_unique
ON "Message" ("chatId", "clientKey")
WHERE "clientKey" IS NOT NULL;`;

async function main() {
  console.log("Creating partial unique index for clientKey (concurrent)...");
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log("Index creation SQL executed.");
  } catch (err) {
    console.error("Error executing index creation SQL:", err);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

main();

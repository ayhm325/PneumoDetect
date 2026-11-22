#!/usr/bin/env node
import prisma from "../lib/prismaClient.js";

async function main() {
  const chat = await prisma.chat.findFirst();
  if (!chat) {
    console.error("No chat found in DB");
    process.exit(1);
  }
  console.log(chat.id);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
import prisma from "../lib/prismaClient.js";

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No users found in DB");
    process.exit(1);
  }
  console.log(user.email);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

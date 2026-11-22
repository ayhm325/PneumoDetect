#!/usr/bin/env node
import prisma from "../lib/prismaClient.js";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/query-user.js <email>");
    process.exit(2);
  }
  const user = await prisma.user.findUnique({ where: { email } });
  console.log(JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error querying user:", e);
  process.exit(1);
});

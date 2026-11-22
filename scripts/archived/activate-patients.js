#!/usr/bin/env node
import prisma from "../lib/prismaClient.js";

async function main() {
  console.log("Setting isActive=true for all users with role=patient...");
  const result = await prisma.user.updateMany({
    where: { role: "patient" },
    data: { isActive: true },
  });
  console.log("Updated users count:", result.count);
}

main()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  });

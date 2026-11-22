#!/usr/bin/env node
import prisma from "../lib/prismaClient.js";

(async function () {
  try {
    const reqs = await prisma.changeRequest.findMany({
      where: { type: "doctor_change" },
      orderBy: { createdAt: "desc" },
    });
    console.log(`Found ${reqs.length} doctor_change requests:\n`);
    for (const r of reqs) {
      console.log({
        id: r.id,
        userId: r.userId,
        status: r.status,
        details: r.details,
        createdAt: r.createdAt,
      });
    }
    process.exit(0);
  } catch (e) {
    console.error("Error querying changeRequest:", e);
    process.exit(1);
  }
})();

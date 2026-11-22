import prisma from "../lib/prismaClient.js";
import { randomUUID } from "crypto";

async function backfill() {
  try {
    const patients = await prisma.patient.findMany();
    console.log("Found", patients.length, "patients");

    for (const p of patients) {
      const updates = {};
      if (!p.id) updates.id = randomUUID();
      if ((!p.fullName || !p.email) && p.userId) {
        const user = await prisma.user.findUnique({ where: { id: p.userId } });
        if (user) {
          if (!p.fullName) updates.fullName = user.fullName;
          if (!p.email) updates.email = user.email;
        }
      }

      if (Object.keys(updates).length > 0) {
        // Use raw SQL for updating `id` because Prisma may disallow updating primary key via client API
        const setParts = [];
        const params = [];
        let paramIndex = 1;
        for (const [k, v] of Object.entries(updates)) {
          setParts.push(`"${k}" = $${paramIndex}`);
          params.push(v);
          paramIndex++;
        }
        if (params.length === 0) continue;

        let whereClause = '"userId" = $' + paramIndex;
        params.push(p.userId);

        const sql = `UPDATE "Patient" SET ${setParts.join(", ")} WHERE ${whereClause}`;
        await prisma.$executeRawUnsafe(sql, ...params);
        console.log("Backfilled patient (raw SQL)", p.userId || p.id, updates);
      }
    }

    console.log("Backfill complete");
  } catch (e) {
    console.error("Backfill error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

backfill();

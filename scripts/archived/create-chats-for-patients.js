import prisma from "../lib/prismaClient.js";

(async function createChats() {
  try {
    const patients = await prisma.patient.findMany({
      where: { doctorId: { not: null } },
      include: { doctor: true },
    });
    let created = 0;
    for (const p of patients) {
      const existing = await prisma.chat.findFirst({
        where: { patientId: p.id },
      });
      if (!existing) {
        await prisma.chat.create({
          data: { patientId: p.id, doctorId: p.doctorId },
        });
        created++;
      }
    }
    console.log(`Created ${created} chats`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

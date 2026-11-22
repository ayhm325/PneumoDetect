import prisma from "../lib/prismaClient.js";

async function cleanInvalidDoctors() {
  // حذف أي Doctor ليس له userId صحيح
  const doctors = await prisma.doctor.findMany({ include: { user: true } });
  let deleted = 0;
  for (const doc of doctors) {
    if (!doc.user || !doc.licenseNumber || doc.licenseNumber.trim() === "") {
      await prisma.doctor.delete({ where: { userId: doc.userId } });
      deleted++;
      console.log(`تم حذف Doctor غير صالح: userId=${doc.userId}`);
    }
  }
  console.log(`تم حذف ${deleted} سجل Doctor غير صالح.`);
  process.exit(0);
}

cleanInvalidDoctors().catch((e) => {
  console.error(e);
  process.exit(1);
});

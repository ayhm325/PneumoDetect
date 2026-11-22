import prisma from "../lib/prismaClient.js";

async function suspendAllDoctors() {
  const updated = await prisma.doctor.updateMany({
    data: { isActive: false },
  });
  console.log(
    `تم تعليق جميع الأطباء (Doctor.isActive = false): ${updated.count}`,
  );
  process.exit(0);
}

suspendAllDoctors().catch((e) => {
  console.error(e);
  process.exit(1);
});

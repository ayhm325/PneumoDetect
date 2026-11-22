// سكريبت لتعديل جميع الأطباء إلى isActive: false (معلقين)
import prisma from "../lib/prismaClient.js";

async function suspendAllDoctors() {
  const result = await prisma.user.updateMany({
    where: { role: "doctor" },
    data: { isActive: false },
  });
  console.log(`تم تعديل ${result.count} طبيب إلى معلق (isActive: false)`);
  process.exit(0);
}

suspendAllDoctors().catch((e) => {
  console.error(e);
  process.exit(1);
});

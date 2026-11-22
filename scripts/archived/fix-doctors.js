import prisma from "../lib/prismaClient.js";

async function fixDoctors() {
  // جلب جميع المستخدمين الذين دورهم doctor ولا يوجد لهم سجل Doctor
  const users = await prisma.user.findMany({
    where: {
      role: "doctor",
      isDeleted: false,
    },
  });

  let created = 0;
  for (const user of users) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: user.id },
    });
    if (!doctor) {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          licenseNumber: user.email + "-fix", // مؤقتًا، يجب تعديلها يدويًا لاحقًا
          phone: null,
          isActive: false,
        },
      });
      created++;
      console.log(`تم إنشاء Doctor للطبيب: ${user.fullName} (${user.email})`);
    }
  }
  console.log(`تم إصلاح ${created} طبيبًا.`);
  process.exit(0);
}

fixDoctors().catch((e) => {
  console.error(e);
  process.exit(1);
});

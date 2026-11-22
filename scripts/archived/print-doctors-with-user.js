import prisma from "../lib/prismaClient.js";

async function printDoctorsWithUser() {
  const doctors = await prisma.doctor.findMany({
    include: { user: true },
  });
  console.log("جميع الأطباء في جدول Doctor:");
  for (const doc of doctors) {
    console.log({
      userId: doc.userId,
      isActive: doc.isActive,
      userExists: !!doc.user,
      userEmail: doc.user?.email,
      userFullName: doc.user?.fullName,
      userIsDeleted: doc.user?.isDeleted,
    });
  }
  process.exit(0);
}

printDoctorsWithUser().catch((e) => {
  console.error(e);
  process.exit(1);
});

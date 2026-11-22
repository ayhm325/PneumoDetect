import prisma from "../lib/prismaClient.js";
import bcrypt from "../lib/auth/bcryptWrapper.mjs";

async function createTestDoctor() {
  const email = `testdoc${Date.now()}@example.com`;
  const password = await bcrypt.hash("Test1234!", 10);
  const fullName = "Test Doctor";
  const licenseNumber = `LIC${Math.floor(Math.random() * 100000)}`;
  const phone = "0500000000";

  // إنشاء المستخدم
  const user = await prisma.user.create({
    data: {
      email,
      password,
      fullName,
      role: "doctor",
      isActive: true,
    },
  });

  // إنشاء سجل Doctor مع isActive=false
  await prisma.doctor.create({
    data: {
      userId: user.id,
      licenseNumber,
      phone,
      isActive: false,
    },
  });

  console.log("تم إنشاء طبيب تجريبي:", {
    email,
    password: "Test1234!",
    licenseNumber,
  });
  process.exit(0);
}

createTestDoctor().catch((e) => {
  console.error(e);
  process.exit(1);
});

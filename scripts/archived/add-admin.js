import prisma from "../lib/prismaClient.js";
import bcrypt from "../lib/auth/bcryptWrapper.mjs";

async function main() {
  const email = "ayhm@yahoo.com";
  const password = "Ay157950!";
  const fullName = "Ayhm Obeidat";
  const role = "admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("User already exists.");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      role,
      isActive: true,
    },
  });
  console.log("Admin user created:", user);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

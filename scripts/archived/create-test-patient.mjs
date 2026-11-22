import prisma from "../lib/prismaClient.js";
import jwt from "jsonwebtoken";
import bcrypt from "../lib/auth/bcryptWrapper.mjs";

const SECRET = process.env.JWT_SECRET || "3f8b2e1c-strong-secret-key-2025";
(async function () {
  try {
    const timestamp = Date.now();
    const email = `e2e-patient-${timestamp}@example.com`;
    const password = await bcrypt.hash("Test1234!", 10);
    const user = await prisma.user.create({
      data: {
        email,
        password,
        fullName: "E2E Patient",
        role: "patient",
        isActive: true,
      },
    });
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        isActive: true,
      },
      SECRET,
      { expiresIn: "2h" },
    );
    // Print JSON with token and userId for test harness consumption
    console.log(JSON.stringify({ token, userId: user.id }));
  } catch (e) {
    console.error("error", e && e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

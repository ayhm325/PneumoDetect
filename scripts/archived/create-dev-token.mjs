import prisma from "../lib/prismaClient.js";
import jwt from "jsonwebtoken";

const email = process.argv[2];
const SECRET = process.env.JWT_SECRET || "your-secret-key";

if (!email) {
  console.error("Usage: node scripts/create-dev-token.mjs <user-email>");
  process.exit(1);
}

(async function main() {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error("No user found with email", email);
      process.exit(2);
    }
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
    const token = jwt.sign(payload, SECRET, { expiresIn: "2h" });
    console.log(token);
  } catch (e) {
    console.error("error creating token", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

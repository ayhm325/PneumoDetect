// scripts/checkUser.mjs
import prisma from "../lib/prismaClient.js";

const USER_ID = "7e5dc12f-4c87-4e2f-a4cd-66c412e77f1a";

(async () => {
  try {
    const user = await prisma.user.findUnique({ where: { id: USER_ID } });
    console.log(user);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();

import prisma from "../lib/prismaClient.js";

(async function main() {
  try {
    const cs = await prisma.chat.findMany({ take: 20 });
    console.log(cs.map((c) => c.id));
  } catch (e) {
    console.error("error listing chats", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

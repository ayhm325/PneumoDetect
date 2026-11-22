import prisma from "../lib/prismaClient.js";
const id = process.argv[2];
(async function main() {
  if (!id) {
    console.error("Usage: node scripts/show-chat.mjs <chatId>");
    process.exit(1);
  }
  try {
    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { patient: true, doctor: true },
    });
    console.dir(chat, { depth: null });
  } catch (e) {
    console.error("error fetching chat", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

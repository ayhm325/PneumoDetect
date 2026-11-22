import prisma from "../lib/prismaClient.js";
const chatId = process.argv[2];

(async function main() {
  if (!chatId) {
    console.error("Usage: node scripts/show-messages.mjs <chatId>");
    process.exit(1);
  }
  try {
    const msgs = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    });
    console.log(`Found ${msgs.length} messages for chat ${chatId}`);
    for (const m of msgs) {
      console.log({
        id: m.id,
        chatId: m.chatId,
        senderId: m.senderId,
        text: m.text,
        createdAt: m.createdAt,
      });
    }
  } catch (e) {
    console.error("error fetching messages", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

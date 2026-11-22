import prisma from "../lib/prismaClient.js";

const [, , chatId, senderRole, ...textParts] = process.argv;
const text = textParts.join(" ") || "Test message (direct DB insert)";

(async function main() {
  if (!chatId || !senderRole) {
    console.error(
      "Usage: node scripts/insert-message.mjs <chatId> <sender: doctor|patient> [text]",
    );
    process.exit(1);
  }
  if (!["doctor", "patient"].includes(senderRole)) {
    console.error('sender must be "doctor" or "patient"');
    process.exit(1);
  }
  try {
    const msg = await prisma.message.create({
      data: { chatId, sender: senderRole, text },
    });
    console.log("Inserted message:", {
      id: msg.id,
      chatId: msg.chatId,
      sender: msg.sender,
      text: msg.text,
    });
  } catch (e) {
    console.error("error inserting message", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

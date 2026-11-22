#!/usr/bin/env node
import prisma from "../lib/prismaClient.js";

async function main() {
  const chatId = process.argv[2];
  if (!chatId) {
    console.error("Usage: node scripts/get-chat-participants.mjs <chatId>");
    process.exit(2);
  }
  const chat = await prisma.chat.findUnique({ where: { id: chatId } });
  if (!chat) {
    console.error("Chat not found", chatId);
    process.exit(3);
  }
  console.log(
    "chat:",
    chat.id,
    "doctorId:",
    chat.doctorId,
    "patientId:",
    chat.patientId,
  );
  const doctorUser = chat.doctorId
    ? await prisma.user.findUnique({ where: { id: chat.doctorId } })
    : null;
  const patientRecord = chat.patientId
    ? await prisma.patient.findUnique({ where: { id: chat.patientId } })
    : null;
  const patientUser =
    patientRecord && patientRecord.userId
      ? await prisma.user.findUnique({ where: { id: patientRecord.userId } })
      : null;
  console.log("doctor user email:", doctorUser?.email || "none");
  console.log("patient user email:", patientUser?.email || "none");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

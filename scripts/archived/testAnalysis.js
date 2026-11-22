import prisma from "../lib/prismaClient.js";

async function run() {
  try {
    const data = await prisma.analysisResult.findMany();
    console.log(data);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();

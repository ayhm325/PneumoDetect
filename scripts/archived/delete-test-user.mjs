import prisma from "../lib/prismaClient.js";

const userId = process.argv[2];
if (!userId) {
  console.error("Usage: node scripts/delete-test-user.mjs <userId>");
  process.exit(1);
}

(async function main() {
  try {
    // Delete analysis results for user
    await prisma.analysisResult.deleteMany({ where: { userId } });
    // Delete other related records if needed (extend as required)

    // Delete user
    await prisma.user.delete({ where: { id: userId } });
    console.log("deleted", userId);
  } catch (e) {
    console.error("error deleting user data", e && e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

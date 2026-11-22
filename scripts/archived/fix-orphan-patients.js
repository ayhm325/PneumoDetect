import prisma from "../lib/prismaClient.js";

// This script will find all Patient records with a null userId and attempt to link them to a User with matching email.
// If no matching User is found, it will create a new User and link it.

async function fixOrphanPatients() {
  const orphanPatients = await prisma.patient.findMany({
    where: { OR: [{ userId: null }, { userId: "" }] },
  });
  for (const patient of orphanPatients) {
    let user = await prisma.user.findUnique({
      where: { email: patient.email },
    });
    if (!user) {
      // Create a new user if not found
      user = await prisma.user.create({
        data: {
          fullName: patient.fullName,
          email: patient.email,
          password: "changeme", // Set a default password, should be changed by user
          role: "patient",
          isActive: true,
        },
      });
      console.log(`Created new user for patient ${patient.id}`);
    }
    // Update patient to link to user
    await prisma.patient.update({
      where: { id: patient.id },
      data: { userId: user.id },
    });
    console.log(`Linked patient ${patient.id} to user ${user.id}`);
  }
  console.log("Done fixing orphan patients.");
  await prisma.$disconnect();
}

fixOrphanPatients().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});

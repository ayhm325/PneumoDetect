import prisma from "../lib/prismaClient.js";

(async () => {
  try {
    const rows = await prisma.appointment.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    console.log("Latest appointments (most recent first):");
    for (const a of rows) {
      console.log("---");
      console.log("id:", a.id);
      console.log(
        "doctorId:",
        a.doctorId,
        "doctorUserId:",
        a.doctor?.userId || null,
        "doctorName:",
        a.doctor?.user?.fullName || a.doctor?.user?.displayName || null,
        "doctorPhone:",
        a.doctor?.phone || null,
        "doctorUserPhone:",
        a.doctor?.user?.phone || null,
        "doctorClinic:",
        a.doctor?.clinic || null,
        "doctorUserAddress:",
        a.doctor?.user?.address || null,
      );
      console.log(
        "patientId:",
        a.patientId,
        "patientUserId:",
        a.patient?.userId || null,
        "patientName:",
        a.patient?.fullName || a.patient?.user?.fullName || null,
        "patientPhone:",
        a.patient?.phone || null,
        "patientUserPhone:",
        a.patient?.user?.phone || null,
        "patientAddress:",
        a.patient?.user?.address || null,
      );
      console.log("scheduledAt:", a.scheduledAt);
      console.log("status:", a.status);
      console.log("reason:", a.reason);
      console.log("createdAt:", a.createdAt);
    }
  } catch (err) {
    console.error("Error querying appointments:", err);
  } finally {
    await prisma.$disconnect();
  }
})();

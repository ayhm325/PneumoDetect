// هذا السكريبت مخصص للاستخدام اليدوي فقط
// وظيفته تهيئة قاعدة البيانات ببيانات تجريبية (admin, doctor, patient, chat)
// لا يتم تشغيله تلقائيًا من أوامر npm أو prisma
// لتشغيله يدويًا:
//    node prisma/seed.cjs
// استدعاء PrismaClient للتعامل مع قاعدة البيانات
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * الدالة الرئيسية التي تنفذ عملية seeding
 * أي إنشاء بيانات أولية في قاعدة البيانات
 */
async function main() {
  // إنشاء أو تحديث المستخدم الإداري (Admin)
  const admin = await prisma.user.upsert({
    // نبحث عن مستخدم موجود بنفس البريد الإلكتروني
    where: { email: "admin@example.com" },
    // إذا وجدناه، لا نحدث أي شيء (update فارغة)
    update: {},
    // إذا لم يوجد، نقوم بإنشاء مستخدم جديد بالإعدادات التالية
    create: {
      email: "admin@example.com",
      password: "changeme",  // يجب تغييرها لاحقًا
      fullName: "Admin User",
      role: "admin",
      isActive: true,
    },
  });

  // إنشاء أو تحديث مستخدم طبيب (Doctor)
  const doctorUser = await prisma.user.upsert({
    where: { email: "doctor@example.com" },
    update: {},
    create: {
      email: "doctor@example.com",
      password: "changeme",
      fullName: "Dr. John Doe",
      role: "doctor",
      isActive: true,
    },
  });

  // إنشاء أو تحديث بيانات الطبيب في جدول Doctor
  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,        // الربط مع مستخدم الطبيب
      phone: "0500000001",
      licenseNumber: "LIC-12345",
      status: "active",             // الحالة الحالية للطبيب
    },
  });

  // إنشاء أو تحديث مستخدم مريض (Patient)
  const patientUser = await prisma.user.upsert({
    where: { email: "patient@example.com" },
    update: {},
    create: {
      email: "patient@example.com",
      password: "changeme",
      fullName: "Patient One",
      role: "patient",
      isActive: true,
    },
  });

  // إنشاء أو تحديث بيانات المريض في جدول Patient
  const patient = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,      // الربط مع مستخدم المريض
      fullName: "Patient One",
      email: "patient@example.com",
      doctorId: doctor.userId,     // تعيين طبيب المريض
    },
  });

  // إنشاء محادثة افتراضية بين الطبيب والمريض
  await prisma.chat.upsert({
    where: { id: "seed-chat-1" }, // معرف ثابت للمحادثة التجريبية
    update: {},
    create: {
      id: "seed-chat-1",
      doctorId: doctor.userId,
      patientId: patient.id,
    },
  });

  // طباعة رسالة نجاح مع معرفات المستخدمين
  console.log("Database seeded successfully");
  console.log({
    adminId: admin.id,
    doctorUserId: doctorUser.id,
    patientUserId: patientUser.id,
  });
}

// تنفيذ الدالة الرئيسية مع معالجة الأخطاء
main()
  .catch((e) => {
    console.error(e); // طباعة أي خطأ قد يحدث
    process.exit(1);  // إنهاء العملية برمز خطأ
  })
  .finally(async () => {
    // فصل الاتصال بقاعدة البيانات بعد الانتهاء
    await prisma.$disconnect();
  });

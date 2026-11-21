// هذا السكريبت مخصص للاستخدام اليدوي فقط
// وظيفته تهيئة قاعدة البيانات ببيانات تجريبية (admin, doctor, patient, chat)
// لا يتم تشغيله تلقائيًا من أوامر npm أو prisma
// لتشغيله يدويًا:
//    node prisma/seed.js
// استدعاء PrismaClient للتعامل مع قاعدة البيانات
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * الدالة الرئيسية التي تقوم بإنشاء بيانات أولية للتجربة
 * مثل المستخدمين (admin, doctor, patient) والمحادثة التجريبية
 */
async function main() {
  // إنشاء أو تحديث المستخدم الإداري
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" }, // البحث حسب البريد
    update: {}, // لا نقوم بتحديث أي شيء إذا وجد المستخدم
    create: {
      email: "admin@example.com",
      password: "changeme", // يجب تغييره لاحقًا
      fullName: "Admin User",
      role: "admin",
      isActive: true, // المستخدم مفعل
    },
  });

  // إنشاء أو تحديث مستخدم طبيب
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
    where: { userId: doctorUser.id }, // الربط مع مستخدم الطبيب
    update: {},
    create: {
      userId: doctorUser.id,
      phone: "0500000001",       // رقم الهاتف
      licenseNumber: "LIC-12345", // رقم الترخيص
      status: "active",           // الحالة الحالية للطبيب
    },
  });

  // إنشاء أو تحديث مستخدم المريض
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
    where: { userId: patientUser.id }, // الربط مع مستخدم المريض
    update: {},
    create: {
      userId: patientUser.id,
      fullName: "Patient One",
      email: "patient@example.com",
      doctorId: doctor.userId, // ربط المريض بالطبيب
    },
  });

  // إنشاء محادثة افتراضية بين الطبيب والمريض للاختبارات
  await prisma.chat.upsert({
    where: { id: "seed-chat-1" }, // معرف ثابت للمحادثة
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

// تنفيذ الدالة الرئيسية مع التعامل مع الأخطاء
main()
  .catch((e) => {
    console.error(e); // طباعة أي خطأ قد يحدث
    process.exit(1);  // إنهاء العملية برمز خطأ
  })
  .finally(async () => {
    await prisma.$disconnect(); // قطع الاتصال بقاعدة البيانات بعد الانتهاء
  });

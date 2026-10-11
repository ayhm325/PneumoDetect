// ===============================================
// Wrapper لمكتبة bcrypt مع دعم fallback إلى bcryptjs
// ===============================================
// هذا الملف مسؤول عن:
// 1. تفضيل استخدام المكتبة الأصلية "bcrypt" (native) لأداء أفضل
// 2. fallback تلقائي إلى "bcryptjs" في حال عدم توفر المكتبة الأصلية
// 3. تصدير دوال التشفير والمقارنة بطريقة موحدة
// 4. دعم كل من الاستخدام غير المتزامن (async) والمتزامن (sync)

// ===============================================
// محاولة استيراد bcrypt الأصلي (native)
let bcryptMod;
try {
  const mod = await import("bcrypt");
  // بعض المكتبات تصدر default، البعض لا، لذلك نتحقق
  bcryptMod = mod?.default || mod;
} catch (e) {
  // إذا فشل الاستيراد (مثلاً على بيئة غير داعمة للnative)
  // نستخدم bcryptjs كبديل
  const mod = await import("bcryptjs");
  bcryptMod = mod?.default || mod;
}

// ===============================================
// دوال غير متزامنة (async)
const hash = (...args) => bcryptMod.hash(...args);       // تشفير كلمة مرور
const compare = (...args) => bcryptMod.compare(...args); // مقارنة كلمة مرور مع hash
const genSalt = (...args) =>
  bcryptMod.genSalt ? bcryptMod.genSalt(...args) : Promise.resolve(10); // توليد Salt (افتراضي 10)

// ===============================================
// دوال متزامنة (sync)
const hashSync = (...args) =>
  bcryptMod.hashSync ? bcryptMod.hashSync(...args) : undefined;
const compareSync = (...args) =>
  bcryptMod.compareSync ? bcryptMod.compareSync(...args) : undefined;

// ===============================================
// التصدير: كائن مفرد + تصدير مسمى لكل دالة
export { hash, compare, genSalt, hashSync, compareSync };
const bcrypt = { hash, compare, genSalt, hashSync, compareSync };
export default bcrypt;

// ===============================================
// ملاحظات:
// - hash و hashSync : لتشفير كلمة المرور
// - compare و compareSync : للتحقق من كلمة المرور مقابل الـ hash
// - genSalt : توليد قيمة Salt عشوائية لتقوية التشفير
// - يدعم fallback تلقائي بين bcrypt و bcryptjs لتجنب مشاكل البيئة
// - يفضل دائمًا استخدام النسخة native إذا كانت متوفرة لأداء أفضل
// ===============================================

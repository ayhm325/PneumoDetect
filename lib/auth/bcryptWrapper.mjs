// ===============================================
// Wrapper لمكتبة bcrypt مع دعم fallback إلى bcryptjs
// ===============================================
// هذا الملف مسؤول عن:
// 1. تفضيل استخدام المكتبة الأصلية "bcrypt" (native) لأداء أفضل
// 2. fallback تلقائي إلى "bcryptjs" في حال عدم توفر المكتبة الأصلية
// 3. تصدير دوال التشفير والمقارنة بطريقة موحدة
// 4. دعم كل من الاستخدام غير المتزامن (async) والمتزامن (sync)

// ===============================================
// استيراد bcrypt / bcryptjs بطريقة متوافقة مع ESM و CommonJS بدون top-level await
import bcryptjs from "bcryptjs";
let bcryptMod = bcryptjs;

try {
  if (typeof require === "function") {
    const nativeBcrypt = require("bcrypt");
    if (nativeBcrypt) bcryptMod = nativeBcrypt?.default || nativeBcrypt;
  }
} catch {
  bcryptMod = bcryptjs;
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

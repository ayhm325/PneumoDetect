// دالة مساعدة (Helper) آمنة للعمل في بيئة Edge / Middleware
// السبب: بيئة Edge لا تدعم الوصول إلى النظام (FS) أو Redis مباشرة
// لذلك نتحقق من حالة إلغاء التوكن عبر استدعاء API داخلي

// الدالة المصدّرة الوحيدة من هذا الملف
// token   : JWT المراد التحقق منه
// baseUrl : عنوان الطلب الحالي (مثل request.url) لإنشاء رابط مطلق للـ API
export async function isTokenRevoked(token, baseUrl) {
  // إذا لم يوجد توكن، نعتبره غير ملغى (لا يوجد ما نتحقق منه)
  if (!token) return false;

  // في بيئة Edge يجب تمرير baseUrl لإنشاء URL مطلق
  // بدون baseUrl لا يمكن استخدام fetch داخلي بشكل صحيح
  if (!baseUrl) throw new Error("baseUrl required in Edge runtime");

  try {
    // إنشاء عنوان URL مطلق لنقطة النهاية الداخلية
    // /api/auth/is-revoked هي API تتحقق من حالة إلغاء التوكن
    const url = new URL("/api/auth/is-revoked", baseUrl);

    // إرسال طلب POST إلى الـ API الداخلي
    const resp = await fetch(url.toString(), {
      method: "POST",

      // إرسال التوكن في الهيدر Authorization بصيغة Bearer
      // لأن Edge لا يمكنه قراءة HttpOnly cookies
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      // منع التخزين المؤقت
      // لأن حالة التوكن قد تتغير (logout)
      cache: "no-store",
    });

    // إذا كان الرد غير ناجح (مثلاً 401 أو 500)
    // نعتبر التوكن غير ملغى افتراضيًا لتجنب كسر التطبيق
    if (!resp.ok) return false;

    // قراءة جسم الاستجابة
    const body = await resp.json();

    // نتوقع أن يحتوي الرد على:
    // { revoked: true | false }
    return Boolean(body?.revoked);
  } catch (e) {
    // في حال حدوث أي خطأ (غالبًا بسبب قيود Edge مثل FS أو Network)
    // نرمي خطأ مخصص يوضّح أن التخزين غير متاح في هذه البيئة
    const err = new Error("FS_UNAVAILABLE");
    err.code = "FS_UNAVAILABLE";
    throw err;
  }
}

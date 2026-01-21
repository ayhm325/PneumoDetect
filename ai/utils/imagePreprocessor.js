// ai/utils/imagePreprocessor.js
// وحدة (Module) لمعالجة الصورة مبدئيًا قبل إرسالها إلى نموذج الذكاء الاصطناعي
// تُستخدم هذه الدالة في المرحلة الرابعة (Phase 4) من خط المعالجة (Pipeline)

// دالة تستقبل ملف الصورة القادم من الطلب (عادة عبر multer أو formidable)
export function preprocessImage(file) {
  // التحقق من وجود الملف أساسًا
  // في حال لم يتم إرسال أي ملف، يتم إيقاف التنفيذ وإرجاع خطأ
  if (!file) {
    throw new Error("No image provided");
  }

  // التحقق من نوع الملف (MIME Type)
  // 1- التأكد من وجود الخاصية mimetype
  // 2- التأكد أن نوعها نص (string)
  // 3- التأكد أن الملف من نوع صورة (image/*)
  if (
    !file.mimetype ||
    typeof file.mimetype !== "string" ||
    !file.mimetype.startsWith("image/")
  ) {
    // في حال كان الملف ليس صورة (مثل PDF أو TXT)
    // يتم إيقاف المعالجة لحماية النظام
    throw new Error("Invalid file type");
  }

  // إرجاع بيانات الصورة بعد التحقق منها
  // buffer: المحتوى الثنائي للصورة لاستخدامه في المعالجة أو الإرسال للنموذج
  // originalName: اسم الملف الأصلي (للتخزين أو التسجيل)
  // size: حجم الملف بالبايت (للتأكد من عدم تجاوز الحدود المسموحة)
  return {
    buffer: file.buffer,
    originalName: file.originalname,
    size: file.size,
  };
}

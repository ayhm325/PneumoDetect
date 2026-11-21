/*
  هذا الملف يحدد "عقد" (Contract) ثابت لبنية الاستجابة لنتائج التحليل باستخدام الذكاء الاصطناعي.
  جميع النماذج (سواء كانت وهمية أو حقيقية) يجب أن تلتزم بهذه البنية.

  الشكل الرسمي (لا تغييره):

  {
    "analysis_id": "string",          // معرف فريد للتحليل
    "prediction": "string",           // النتيجة المتوقعة من النموذج (مثلاً NORMAL / PNEUMONIA)
    "confidence": "number",           // درجة الثقة (0 إلى 1)
    "explanation": "string",          // أي توضيح أو تعليق من النموذج
    "heatmap_url": "string | null",   // رابط صورة الـ heatmap أو null إذا لم يتوفر
    "model_version": "string",        // إصدار النموذج
    "inference_time_ms": "number",    // وقت التنفيذ بالمللي ثانية
    "created_at": "datetime"          // تاريخ ووقت إنشاء التحليل
  }

  هذا الملف يوفر أداة صغيرة للتحقق من التزام أي كائن بهذا العقد.
*/

// قائمة الحقول الثابتة (غير قابلة للتعديل)
const FIELDS = Object.freeze([
  "analysis_id",
  "prediction",
  "confidence",
  "explanation",
  "heatmap_url",
  "model_version",
  "inference_time_ms",
  "created_at",
]);

// ===== دوال مساعدة لفحص نوع البيانات =====

// تحقق من أن القيمة نصية (String)
function _isString(v) {
  return typeof v === "string";
}

// تحقق من أن القيمة رقمية صالحة (Number)
function _isNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

// تحقق من أن القيمة null
function _isNull(v) {
  return v === null;
}

// تحقق من أن القيمة تشبه التاريخ (Date أو ISO string)
function _isDateLike(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return true; // كائن Date صالح
  if (typeof v === "string") return !isNaN(Date.parse(v)); // نص يمثل تاريخ صالح
  return false;
}

// ===== دالة التحقق الرئيسية =====
function validate(obj) {
  const errors = [];

  // تحقق أن المدخل هو كائن
  if (!obj || typeof obj !== "object") {
    errors.push("response:not_object");
    return { valid: false, errors };
  }

  // تحقق من وجود جميع الحقول المطلوبة
  for (const f of FIELDS) {
    if (!(f in obj)) errors.push(`missing.${f}`);
  }

  // ===== التحقق من نوع كل حقل =====
  if ("analysis_id" in obj && !_isString(obj.analysis_id))
    errors.push("analysis_id:string");

  if ("prediction" in obj && !_isString(obj.prediction))
    errors.push("prediction:string");

  if ("confidence" in obj) {
    if (!_isNumber(obj.confidence)) errors.push("confidence:number");
    else if (!(obj.confidence >= 0 && obj.confidence <= 1))
      errors.push("confidence:0-1"); // يجب أن يكون بين 0 و 1
  }

  if ("explanation" in obj && !_isString(obj.explanation))
    errors.push("explanation:string");

  if ("heatmap_url" in obj) {
    const v = obj.heatmap_url;
    if (!(_isNull(v) || _isString(v))) errors.push("heatmap_url:string|null");
  }

  if ("model_version" in obj && !_isString(obj.model_version))
    errors.push("model_version:string");

  if ("inference_time_ms" in obj && !_isNumber(obj.inference_time_ms))
    errors.push("inference_time_ms:number");

  if ("created_at" in obj && !_isDateLike(obj.created_at))
    errors.push("created_at:datetime");

  // إرجاع النتيجة النهائية: هل الكائن صالح؟ وما هي الأخطاء (إن وجدت)
  return { valid: errors.length === 0, errors };
}

// تصدير الحقول والدالة لاستخدامها في ملفات أخرى
module.exports = { FIELDS, validate };

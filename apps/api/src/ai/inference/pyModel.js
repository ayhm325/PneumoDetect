// ai/inference/pyModel.js
// محول (Adapter) لاستدعاء خادم النموذج البايثون المحلي عبر /predict
// الهدف: يسمح لنظام Node.js بالتواصل مع النموذج البايثون بشكل شفاف

import fetch from "node-fetch"; 
// مكتبة لإجراء طلبات HTTP من Node.js (مثل fetch في المتصفح)

// تحديد عنوان خادم بايثون المحلي، يمكن تغييره عبر متغير البيئة PY_MODEL_URL
const PY_URL = process.env.PY_MODEL_URL || "http://127.0.0.1:8000/predict";

/**
 * الدالة الأساسية لتشغيل نموذج البايثون
 * @param prepared - كائن الصورة المحضرة (محتوي buffer وخصائص أخرى)
 * @param options - خيارات إضافية مثل طلب heatmap
 * @returns JSON من خادم البايثون يحتوي على نتيجة التحليل
 */
export async function runPyModel(prepared, options = {}) {
  // تحويل بيانات الصورة إلى Base64
  const b64 = Buffer.isBuffer(prepared.buffer)
    ? prepared.buffer.toString("base64") // إذا كانت Buffer مباشرة
    : Buffer.from(prepared.buffer).toString("base64"); // إذا كانت ArrayBuffer أو غيرها

  // تحويل خيار heatmap إلى boolean
  const with_heatmap = !!options.with_heatmap;

  // إرسال طلب POST إلى خادم البايثون مع جسم JSON
  const res = await fetch(PY_URL, {
    method: "POST", // نوع الطلب POST
    headers: { "Content-Type": "application/json" }, // نوع المحتوى JSON
    body: JSON.stringify({ image_base64: b64, with_heatmap }), // جسم الطلب
  });

  // التحقق من نجاح الاستجابة
  if (!res.ok) throw new Error(`Python model server returned ${res.status}`);

  // إعادة نتيجة التحليل (JSON) مباشرة
  return await res.json();
}

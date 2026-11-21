// ai/inference/mockModel.js
// نموذج وهمي (Mock Model) بالكامل — يحاكي عملية الاستدلال (Inference)
// الهدف: اختبار النظام بدون الحاجة للنموذج الحقيقي
// يعيد نتيجة متوافقة مع العقد (contract) المطلوب

import crypto from "crypto"; 
// مكتبة Node.js لتوليد UUID

// مصفوفة من التنبؤات الممكنة للنموذج الوهمي
const POSSIBLE_PREDICTIONS = ["Pneumonia", "Normal", "COVID-19"];

// دالة لاختيار تنبؤ عشوائي من POSSIBLE_PREDICTIONS
function randomPrediction() {
  const index = Math.floor(Math.random() * POSSIBLE_PREDICTIONS.length);
  return POSSIBLE_PREDICTIONS[index];
}

// دالة لتوليد قيمة ثقة عشوائية بين 0.75 و0.95 (75%-95%)
function randomConfidence() {
  return Number((Math.random() * (0.95 - 0.75) + 0.75).toFixed(2));
}

// دالة لتوليد UUID فريد لكل تحليل
function _uuid() {
  if (crypto && typeof crypto.randomUUID === "function")
    return crypto.randomUUID(); // استخدام الوظيفة المدمجة إذا متاحة
  // fallback لطريقة توليد UUID يدوياً (RFC4122 v4)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * الدالة الأساسية لتشغيل النموذج الوهمي
 * @param imageBuffer - بيانات الصورة (Buffer)
 * @returns كائن تحليل وهمي متوافق مع العقد
 */
export async function runMockModel(imageBuffer) {
  const startTime = Date.now(); // تسجيل وقت البدء

  // تأخير وهمي لمحاكاة زمن الاستدلال (~600ms)
  await new Promise((resolve) => setTimeout(resolve, 600));

  // توليد تنبؤ وثقة عشوائية
  const prediction = randomPrediction();
  const confidence = randomConfidence();

  const endTime = Date.now(); // تسجيل وقت الانتهاء

  // إعادة النتيجة بشكل متوافق مع العقد المطلوب
  return {
    analysis_id: _uuid(), // معرف فريد لكل تحليل
    prediction, // التنبؤ النهائي
    confidence, // الثقة
    explanation: "Mock analysis based on simulated pattern recognition.", // شرح وهمي
    // heatmap وهمي صغير (1x1 شفاف) لتجنب الأخطاء أثناء التطوير
    heatmap_url:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
    model_version: "mock-v1", // إصدار النموذج الوهمي
    inference_time_ms: endTime - startTime, // زمن الاستدلال بالملي ثانية
    created_at: new Date().toISOString(), // وقت إنشاء التحليل
  };
}

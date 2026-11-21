// ai/inference/inference.service.js
// خدمة الاستدلال (Inference Service):
// - تحضير الصورة (preprocessing)
// - استدعاء النموذج (وهمي أو Python حقيقي)
// - إعادة النتيجة بشكل موحد مع UUID، الثقة، ووقت الاستدلال

import { preprocessImage } from "../utils/imagePreprocessor.js"; 
// دالة لتحويل الصورة من الملف الوارد إلى شكل مناسب للنموذج (Tensor أو Buffer)

import { getModel, useMock } from "./index.js"; 
// دوال لاستدعاء النموذج المختار (mock أو Python) ومعرفة ما إذا كان Mock مفعل

import crypto from "crypto"; 
// مكتبة Node.js لإنشاء UUID وتشفير البيانات إذا لزم الأمر

/**
 * توليد UUID فريد لكل تحليل
 * Node 16.17+ يدعم crypto.randomUUID مباشرة
 * fallback للطريقة التقليدية إذا لم تتوفر
 */
function _uuid() {
  if (crypto && typeof crypto.randomUUID === "function") {
    // استخدام الوظيفة المدمجة في Node
    return crypto.randomUUID();
  }
  // توليد UUID يدوياً (RFC4122 v4)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * الدالة الأساسية لاستدعاء النموذج وتنفيذ الاستدلال
 * @param file - الملف الوارد من المستخدم (يحتوي على بيانات الصورة وخيارات إضافية مثل with_heatmap)
 */
export async function runInference(file) {
  // تحويل الصورة إلى شكل جاهز للنموذج
  const prepared = preprocessImage(file);

  const start = Date.now(); // وقت البدء لقياس زمن الاستدلال
  const model = getModel(); // اختيار النموذج (mock أو Python حقيقي)

  try {
    // طباعة النموذج المستخدم في console للـ debugging
    console.info(
      `[inference.service] using model: ${
        model?.name || (useMock ? "mock" : "python")
      }`,
    );
  } catch (_) {
    // تجاهل أي خطأ في الطباعة
  }

  // تحديد ما إذا كان المستخدم يريد Heatmap
  const requestHeatmap =
    file.with_heatmap === true || process.env.REQUEST_HEATMAP === "1";

  try {
    // تنفيذ الاستدلال عبر النموذج
    const json = await model.infer(prepared, {
      with_heatmap: requestHeatmap,
    });

    const end = Date.now(); // وقت انتهاء الاستدلال

    // استخراج التنبؤ النهائي
    const pred =
      json.prediction || (json.data && json.data.prediction) || "Unknown";

    // استخراج احتمالات التنبؤ
    const probs =
      json.probabilities || (json.data && json.data.probabilities) || null;

    let rawConfidence = 0; // تهيئة قيمة الثقة الخام

    // حساب الثقة بناءً على الاحتمالات
    if (probs && typeof probs === "object") {
      if (typeof probs[pred] === "number") {
        // إذا كانت الثقة مباشرة في التنبؤ
        rawConfidence = probs[pred];
      } else {
        // إذا كانت احتمالات متعددة، اختر أعلى قيمة
        rawConfidence =
          Math.max(
            ...Object.values(probs).filter((v) => typeof v === "number"),
          ) || 0;
      }
    }

    // ضبط الثقة كرقم، مع fallback للقيمة 0 إذا لم تتوفر
    const confidence = Number(rawConfidence) || 0;

    // حد الثقة لتحديد ما إذا كانت النتيجة تحتاج مراجعة طبيب
    const threshold = Number(process.env.MODEL_CONFIDENCE_THRESHOLD) || 0.85;
    const needs_review = confidence < threshold;

    // إعادة النتيجة بشكل موحد للواجهة
    return {
      analysis_id: _uuid(), // معرف فريد لكل تحليل
      prediction: pred, // التنبؤ النهائي
      confidence, // الثقة
      needs_review, // هل يحتاج لمراجعة الطبيب؟
      display_label: needs_review ? "Needs Radiologist Review" : pred, // نص العرض
      explanation: json.explanation ?? null, // شرح النموذج إن وجد
      heatmap_url: json.heatmap_url ?? json.heatmapUrl ?? null, // رابط Heatmap إن تم توليده
      model_version:
        json.model_version ?? json.modelVersion ?? model?.name ?? "unknown", // إصدار النموذج
      inference_time_ms: end - start, // زمن الاستدلال بالمللي ثانية
      created_at: new Date().toISOString(), // وقت إنشاء التحليل
    };
  } catch (e) {
    // إعادة رمي أي خطأ حدث أثناء الاستدلال
    throw e;
  }
}

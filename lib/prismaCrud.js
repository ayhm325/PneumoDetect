// ===============================================
// lib/crud.js
// واجهة عامة للتعامل مع قواعد البيانات عبر Prisma
// ===============================================

import prisma from "./prismaClient.js";

// ===============================================
// خريطة الموديلات لتسهيل الوصول ديناميكيًا
const models = {
  User: prisma.user,
  Doctor: prisma.doctor,
  Patient: prisma.patient,
  Appointment: prisma.appointment,
  MedicalRecord: prisma.medicalRecord,
  Notification: prisma.notification,
  ChangeRequest: prisma.changeRequest,
  Activity: prisma.activity,
  // أضف أي موديلات أخرى حسب الحاجة
};

// ===============================================
// دالة للحصول على موديل ديناميكيًا
export function getModel(modelName) {
  const model = models[modelName];
  if (!model) throw new Error(`Model ${modelName} not found in Prisma Client.`);
  return model;
}

// ===============================================
// Helper: جلب أسماء الحقول من أول سجل في الموديل
async function getModelFields(model) {
  try {
    const first = await model.findFirst();
    return first ? Object.keys(first) : [];
  } catch {
    return [];
  }
}

// ===============================================
// إنشاء سجل جديد
// userId: يستخدم لحقول createdBy إذا موجود
export async function createRecord(modelName, data, userId = null) {
  const model = getModel(modelName);
  const insertData = { ...data };

  try {
    // تحويل userId إلى connect إذا كان موجودًا في البيانات
    if (insertData.userId !== undefined && insertData.userId !== null) {
      insertData.user = { connect: { id: insertData.userId } };
      delete insertData.userId;
    }

    const fields = await getModelFields(model);
    if (userId && fields.includes("createdBy")) {
      insertData.createdBy = userId;
    }

    return await model.create({ data: insertData });
  } catch (error) {
    console.error(`Error creating record in ${modelName}:`, error);
    throw error;
  }
}

// ===============================================
// جلب جميع السجلات مع استبعاد المحذوفة (soft delete)
export async function getAllRecords(modelName, options = {}) {
  const model = getModel(modelName);
  const where = options.where ? { ...options.where } : {};

  try {
    const fields = await getModelFields(model);
    if (fields.includes("isDeleted") && modelName !== "Activity") {
      where.isDeleted = false; // استبعاد المحذوفة
    }

    return await model.findMany({ ...options, where });
  } catch (error) {
    console.error(`Error fetching records from ${modelName}:`, error);
    throw error;
  }
}

// ===============================================
// جلب سجل حسب الـ ID مع استبعاد المحذوفة
export async function getRecordById(
  modelName,
  id,
  idField = "id",
  options = {},
) {
  const model = getModel(modelName);
  const where = { [idField]: id };

  try {
    const fields = await getModelFields(model);
    if (fields.includes("isDeleted") && modelName !== "Activity") {
      where.isDeleted = false;
    }
    return await model.findUnique({ where, ...options });
  } catch (error) {
    console.error(`Error fetching record by id from ${modelName}:`, error);
    throw error;
  }
}

// ===============================================
// تحديث سجل
export async function updateRecord(
  modelName,
  id,
  data,
  userId = null,
  idField = "id",
) {
  const model = getModel(modelName);
  const updateData = { ...data };

  try {
    const fields = await getModelFields(model);
    if (userId && fields.includes("updatedBy")) {
      updateData.updatedBy = userId; // تسجيل من عدّل السجل
    }
    return await model.update({ where: { [idField]: id }, data: updateData });
  } catch (error) {
    console.error(`Error updating record in ${modelName}:`, error);
    throw error;
  }
}

// ===============================================
// حذف سجل (soft delete إذا كان الحقل موجود)
export async function deleteRecord(
  modelName,
  id,
  userId = null,
  idField = "id",
) {
  const model = getModel(modelName);

  try {
    const fields = await getModelFields(model);
    if (fields.includes("isDeleted")) {
      const updateData = { isDeleted: true };
      if (userId && fields.includes("updatedBy")) {
        updateData.updatedBy = userId;
      }
      return await model.update({ where: { [idField]: id }, data: updateData });
    } else {
      // حذف فعلي إذا لم يوجد isDeleted
      return await model.delete({ where: { [idField]: id } });
    }
  } catch (error) {
    console.error(`Error deleting record in ${modelName}:`, error);
    throw error;
  }
}

// ===============================================
// ملاحظات:
// - جميع الدوال تدعم التعامل مع أي موديل معرف في Prisma.
// - createRecord و updateRecord يدعمان حقول createdBy و updatedBy تلقائيًا.
// - deleteRecord يدعم soft delete عند وجود الحقل isDeleted.
// - يمكن إضافة خيارات include أو orderBy عند استدعاء getAllRecords أو getRecordById.
// ===============================================

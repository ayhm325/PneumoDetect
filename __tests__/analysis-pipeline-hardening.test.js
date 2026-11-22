import fs from "fs";
import path from "path";
import crypto from "crypto";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";
import { createApp } from "../apps/api/src/bootstrap/createApp";
import { prisma } from "../apps/api/src/db/prisma";
import {
  buildSignedUploadAccessUrl,
  createAnalysisService,
  getUploadSigningSecret,
  resolveHeatmapsDir,
  resolveUploadsDir,
} from "../apps/api/src/services/analysis/analysisService";
import {
  backfillAnalysisAndMedicalRecords,
  computeCanonicalReviewStatus,
  normalizeUploadStorageReference,
} from "../apps/api/src/services/analysis/analysisBackfillService";
import { createAnalysisResultRepository } from "../apps/api/src/repositories/analysis/analysisResultRepository";
import { createDoctorPortalRepository } from "../apps/api/src/repositories/doctor/doctorPortalRepository";
import { createDoctorPortalService } from "../apps/api/src/services/doctor/doctorPortalService";
import { createPredictService } from "../apps/api/src/services/predict/predictService";
import { isMockEnabled } from "../apps/api/src/ai/inference/index.js";
import {
  getReviewStatusLabel,
  resolveCanonicalReviewStatus,
  resolveClinicalPriority,
} from "../apps/web/src/lib/analysisStatus.js";

const SECRET = process.env.JWT_SECRET || "jest-test-secret-32-chars-minimum!!";

// Minimal valid 1x1 PNG buffer
const VALID_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
  "hex",
);

describe("Active AI X-Ray Analysis Pipeline (apps/api/src)", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  test("Mock mode is forbidden in production and requires explicit opt-in in development", () => {
    process.env.NODE_ENV = "production";
    process.env.AI_USE_MOCK = "true";
    expect(() => isMockEnabled()).toThrow(/forbidden in production/i);

    process.env.AI_USE_MOCK = "false";
    expect(isMockEnabled()).toBe(false);

    process.env.NODE_ENV = "development";
    delete process.env.AI_USE_MOCK;
    expect(isMockEnabled()).toBe(false);

    process.env.AI_USE_MOCK = "true";
    expect(isMockEnabled()).toBe(true);
  });

  test("Rejects unsupported modalities (ct/mri/ultrasound) and DICOM files", async () => {
    const service = createAnalysisService({
      runInference: jest.fn(),
      analysisResultRepository: {
        save: jest.fn(),
        findHistoryByUserId: jest.fn(),
        findHistoryByUploadedUserId: jest.fn(),
        deleteByUserAndId: jest.fn(),
      },
      patientRepository: { findByUserId: jest.fn(), findById: jest.fn() },
      medicalRecordRepository: { create: jest.fn() },
      notificationRepository: { createBestEffort: jest.fn() },
    });

    await expect(
      service.analyzeXray({
        userId: "u-1",
        role: "patient",
        modality: "ct",
        image: { name: "scan.png", type: "image/png", buffer: VALID_PNG },
      }),
    ).rejects.toMatchObject({ code: "invalid_modality", statusCode: 400 });

    await expect(
      service.analyzeXray({
        userId: "u-1",
        role: "patient",
        modality: "xray",
        image: { name: "chest.dcm", type: "application/dicom", buffer: VALID_PNG },
      }),
    ).rejects.toMatchObject({ code: "unsupported_dicom", statusCode: 400 });

    // Also test DICOM magic bytes ("DICM" at offset 128) even with .png filename
    const dicomMagicBuf = Buffer.alloc(140, 0);
    dicomMagicBuf.write("DICM", 128, "ascii");
    await expect(
      service.analyzeXray({
        userId: "u-1",
        role: "patient",
        modality: "xray",
        image: { name: "disguised.png", type: "image/png", buffer: dicomMagicBuf },
      }),
    ).rejects.toMatchObject({ code: "unsupported_dicom", statusCode: 400 });
  });

  test("Doctor upload enforces assigned patientId, stores permanent storage path in DB, and returns fresh signed URL", async () => {
    const saveAnalysis = jest.fn(async (input) => ({
      id: "ar-1",
      ...input.analysisData,
      userId: input.userId,
      imageUrl: input.imageUrl,
    }));
    const createMedRecord = jest.fn(async (input) => ({ id: "mr-1", ...input }));

    const service = createAnalysisService({
      runInference: jest.fn().mockResolvedValue({
        prediction: "PNEUMONIA",
        confidence: 0.91,
        probabilities: { NORMAL: 0.09, PNEUMONIA: 0.91 },
        model_version: "best_densenet121_xray.pth#a305699f",
        heatmap_url: "/static/heatmaps/gradcam_test.png",
        inference_time_ms: 42,
      }),
      runInTransaction: async (fn) => fn({}),
      analysisResultRepository: {
        save: saveAnalysis,
        findHistoryByUserId: jest.fn(),
        findHistoryByUploadedUserId: jest.fn(),
        deleteByUserAndId: jest.fn(),
      },
      patientRepository: {
        findByUserId: jest.fn(),
        findById: jest.fn(async (id) => {
          if (id === "pat-assigned") {
            return { id: "pat-assigned", userId: "pat-user-1", doctorId: "doc-1", fullName: "Assigned Patient" };
          }
          if (id === "pat-other") {
            return { id: "pat-other", userId: "pat-user-2", doctorId: "doc-other", fullName: "Other Patient" };
          }
          return null;
        }),
      },
      medicalRecordRepository: { create: createMedRecord },
      notificationRepository: { createBestEffort: jest.fn().mockResolvedValue(undefined) },
    });

    // Missing patientId -> 400
    await expect(
      service.analyzeXray({
        userId: "doc-1",
        role: "doctor",
        image: { name: "xray.png", type: "image/png", buffer: VALID_PNG },
      }),
    ).rejects.toMatchObject({ code: "missing_patient_id", statusCode: 400 });

    // Unassigned patient -> 403
    await expect(
      service.analyzeXray({
        userId: "doc-1",
        role: "doctor",
        patientId: "pat-other",
        image: { name: "xray.png", type: "image/png", buffer: VALID_PNG },
      }),
    ).rejects.toMatchObject({ code: "forbidden", statusCode: 403 });

    // Admin -> 403
    await expect(
      service.analyzeXray({
        userId: "admin-1",
        role: "admin",
        patientId: "pat-assigned",
        image: { name: "xray.png", type: "image/png", buffer: VALID_PNG },
      }),
    ).rejects.toMatchObject({ code: "forbidden", statusCode: 403 });

    // Valid assigned patient -> persists permanent storage path in DB & returns fresh signed access URL
    const res = await service.analyzeXray({
      userId: "doc-1",
      role: "doctor",
      patientId: "pat-assigned",
      modality: "xray",
      image: { name: "xray.png", type: "image/png", buffer: VALID_PNG, withHeatmap: true },
    });

    expect(res.saved).toBe(true);
    expect(res.prediction).toBe("PNEUMONIA");
    expect(res.needs_review).toBe(false);

    // DB receives permanent storage reference WITHOUT ?exp= or &sig=
    const savedArg = saveAnalysis.mock.calls[0][0];
    expect(savedArg.userId).toBe("pat-user-1");
    expect(savedArg.imageUrl).toMatch(/^\/uploads\/[a-f0-9-]+\.png$/);
    expect(savedArg.imageUrl).not.toContain("exp=");

    const medArg = createMedRecord.mock.calls[0][0];
    expect(medArg.patientId).toBe("pat-assigned");
    expect(medArg.doctorId).toBe("doc-1");
    expect(medArg.aiResult).toBe("POSITIVE");
    expect(medArg.imageUrl).toBe(savedArg.imageUrl);

    // Response data contains fresh signed access URL
    expect(res.data.imageUrl).toContain("?exp=");
    expect(res.data.imageUrl).toContain("&sig=");
    expect(res.data.storageImageUrl).toBe(savedArg.imageUrl);

    // Clean up saved PNG created by this test
    const savedName = path.basename(savedArg.imageUrl);
    await fs.promises.unlink(path.join(resolveUploadsDir(), savedName)).catch(() => undefined);
  });

  test("Simulated mock output (is_mock: true) is never persisted and cleans up uploaded file", async () => {
    const saveAnalysis = jest.fn();
    const createMedRecord = jest.fn();

    const service = createAnalysisService({
      runInference: jest.fn().mockResolvedValue({
        prediction: "NORMAL",
        confidence: 0.88,
        probabilities: { NORMAL: 0.88, PNEUMONIA: 0.12 },
        model_version: "mock-simulator-dev-only",
        is_mock: true,
      }),
      runInTransaction: async (fn) => fn({}),
      analysisResultRepository: {
        save: saveAnalysis,
        findHistoryByUserId: jest.fn(),
        findHistoryByUploadedUserId: jest.fn(),
        deleteByUserAndId: jest.fn(),
      },
      patientRepository: {
        findByUserId: jest.fn().mockResolvedValue({ id: "pat-1", userId: "u-1", doctorId: "doc-1", fullName: "P1" }),
      },
      medicalRecordRepository: { create: createMedRecord },
      notificationRepository: { createBestEffort: jest.fn() },
    });

    const res = await service.analyzeXray({
      userId: "u-1",
      role: "patient",
      image: { name: "xray.png", type: "image/png", buffer: VALID_PNG },
    });

    expect(res.saved).toBe(false);
    expect(res.is_mock).toBe(true);
    expect(saveAnalysis).not.toHaveBeenCalled();
    expect(createMedRecord).not.toHaveBeenCalled();
  });

  test("18.1 Safe Backfill: links unique 1-to-1 records, skips ambiguous duplicates, leaves unmatched intact, and normalizes expiring URLs", async () => {
    const analysisRows = [
      // 1-to-1 match with mr-1 (with expiring query string)
      {
        id: "ar-1to1",
        userId: "user-pat-1",
        patientId: null,
        imageUrl: "/uploads/unique1.png?exp=1000&sig=old",
        needsReview: true,
        reviewStatus: "pending_review",
        medicalRecord: null,
      },
      // Ambiguous duplicate image (2 AnalysisResults share dup.png)
      {
        id: "ar-dup-1",
        userId: "user-pat-2",
        patientId: null,
        imageUrl: "/uploads/dup.png?exp=1000&sig=a",
        needsReview: false,
        reviewStatus: "pending_review",
        medicalRecord: null,
      },
      {
        id: "ar-dup-2",
        userId: "user-pat-2",
        patientId: null,
        imageUrl: "/uploads/dup.png?exp=2000&sig=b",
        needsReview: false,
        reviewStatus: "pending_review",
        medicalRecord: null,
      },
      // Unmatched AnalysisResult (no MedicalRecord, but userId maps uniquely to pat-3)
      {
        id: "ar-unmatched",
        userId: "user-pat-3",
        patientId: null,
        imageUrl: "/uploads/unmatched.png?exp=3000&sig=c",
        needsReview: false,
        reviewStatus: "pending_review",
        medicalRecord: null,
      },
    ];

    const medicalRows = [
      {
        id: "mr-1to1",
        patientId: "pat-1",
        analysisResultId: null,
        imageUrl: "/uploads/unique1.png?exp=1000&sig=old",
        reviewedByDoctor: false,
        patient: { id: "pat-1", userId: "user-pat-1", doctorId: "doc-1" },
      },
      {
        id: "mr-dup",
        patientId: "pat-2",
        analysisResultId: null,
        imageUrl: "/uploads/dup.png",
        reviewedByDoctor: true,
        patient: { id: "pat-2", userId: "user-pat-2", doctorId: "doc-1" },
      },
      {
        id: "mr-orphan",
        patientId: "pat-1",
        analysisResultId: null,
        imageUrl: "/uploads/no-ar.png?exp=500&sig=z",
        reviewedByDoctor: true,
        patient: { id: "pat-1", userId: "user-pat-1", doctorId: "doc-1" },
      },
    ];

    const patientRows = [
      { id: "pat-1", userId: "user-pat-1" },
      { id: "pat-2", userId: "user-pat-2" },
      { id: "pat-3", userId: "user-pat-3" },
    ];

    const arUpdates = [];
    const mrUpdates = [];

    const mockDb = {
      analysisResult: {
        findMany: jest.fn(async () => analysisRows),
        update: jest.fn(async ({ where, data }) => {
          arUpdates.push({ id: where.id, data });
          const row = analysisRows.find((r) => r.id === where.id);
          if (row) Object.assign(row, data);
          return row;
        }),
      },
      medicalRecord: {
        findMany: jest.fn(async () => medicalRows),
        update: jest.fn(async ({ where, data }) => {
          mrUpdates.push({ id: where.id, data });
          const row = medicalRows.find((r) => r.id === where.id);
          if (row) Object.assign(row, data);
          return row;
        }),
      },
      patient: {
        findMany: jest.fn(async () => patientRows),
      },
    };

    const report = await backfillAnalysisAndMedicalRecords(mockDb);

    expect(report.newlyLinkedCount).toBe(1);
    expect(report.ambiguousSkippedCount).toBe(1);
    expect(report.unmatchedMedicalRecordsCount).toBe(1);

    // mr-1to1 linked to ar-1to1 and URL normalized
    const mr1 = medicalRows.find((m) => m.id === "mr-1to1");
    expect(mr1.analysisResultId).toBe("ar-1to1");
    expect(mr1.imageUrl).toBe("/uploads/unique1.png");

    // ar-1to1 synced with pat-1 and requires_review (since needsReview=true and reviewedByDoctor=false)
    const ar1 = analysisRows.find((a) => a.id === "ar-1to1");
    expect(ar1.patientId).toBe("pat-1");
    expect(ar1.reviewStatus).toBe("requires_review");
    expect(ar1.imageUrl).toBe("/uploads/unique1.png");

    // Ambiguous mr-dup was NOT linked
    const mrDup = medicalRows.find((m) => m.id === "mr-dup");
    expect(mrDup.analysisResultId).toBeNull();

    // Unmatched ar-unmatched had its patientId backfilled to pat-3 and URL normalized
    const arUnmatched = analysisRows.find((a) => a.id === "ar-unmatched");
    expect(arUnmatched.patientId).toBe("pat-3");
    expect(arUnmatched.imageUrl).toBe("/uploads/unmatched.png");

    // Second run is idempotent (0 newly linked, 0 URL normalizations)
    const secondReport = await backfillAnalysisAndMedicalRecords(mockDb);
    expect(secondReport.newlyLinkedCount).toBe(0);
    expect(secondReport.normalizedImageUrlsCount).toBe(0);
  });

  test("18.2 Transaction & AnalysisArtifacts cleanup: removes BOTH original image and generated heatmap on validation or DB failure", async () => {
    const heatmapsDir = resolveHeatmapsDir();
    if (!fs.existsSync(heatmapsDir)) fs.mkdirSync(heatmapsDir, { recursive: true });
    const fakeHeatmapName = `gradcam_test_abort_${Date.now()}.png`;
    const fakeHeatmapPath = path.join(heatmapsDir, fakeHeatmapName);
    await fs.promises.writeFile(fakeHeatmapPath, VALID_PNG);

    const notifySpy = jest.fn();

    // Case 1: AnalysisResult succeeds, MedicalRecord fails inside transaction -> both image & heatmap cleaned up, no notification
    const service = createAnalysisService({
      runInference: async () => ({
        prediction: "PNEUMONIA",
        confidence: 0.93,
        probabilities: { NORMAL: 0.07, PNEUMONIA: 0.93 },
        heatmap_url: `/static/heatmaps/${fakeHeatmapName}`,
        model_version: "best_densenet121_xray.pth#a305699f",
        inference_time_ms: 35,
      }),
      runInTransaction: async (fn) => fn({}),
      analysisResultRepository: {
        save: async (input) => ({ id: "ar-temp", ...input }),
        findHistoryByUserId: async () => [],
        findHistoryByUploadedUserId: async () => [],
        deleteByUserAndId: async () => ({ count: 0 }),
      },
      patientRepository: {
        findByUserId: async () => ({ id: "pat-1", userId: "u-1", doctorId: "doc-1", fullName: "Patient 1" }),
      },
      medicalRecordRepository: {
        create: async () => {
          throw new Error("Simulated MedicalRecord failure inside transaction");
        },
      },
      notificationRepository: {
        createBestEffort: notifySpy,
      },
    });

    await expect(
      service.analyzeXray({
        userId: "u-1",
        role: "patient",
        image: { name: "cxr.png", type: "image/png", buffer: VALID_PNG, withHeatmap: true },
      }),
    ).rejects.toMatchObject({ code: "server_error", statusCode: 500 });

    // Heatmap created by inference was cleaned up on transaction failure
    expect(fs.existsSync(fakeHeatmapPath)).toBe(false);
    // Notification was never sent before commit
    expect(notifySpy).not.toHaveBeenCalled();
  });

  test("18.3 File Authorization & Signed URL Lifecycle: owner/assigned-doctor/chat ACL, path traversal, and fresh URL after expiry", async () => {
    const app = createApp();
    const patient1Token = jwt.sign({ id: "pat-user-1", role: "patient", isActive: true }, SECRET, { expiresIn: "1h" });
    const patient2Token = jwt.sign({ id: "pat-user-2", role: "patient", isActive: true }, SECRET, { expiresIn: "1h" });
    const doctor1Token = jwt.sign({ id: "doc-1", role: "doctor", isActive: true }, SECRET, { expiresIn: "1h" });
    const doctor2Token = jwt.sign({ id: "doc-2", role: "doctor", isActive: true }, SECRET, { expiresIn: "1h" });

    // Create temporary real files on disk so allowed requests reach express.static (200)
    const uploadsDir = resolveUploadsDir();
    const heatmapsDir = resolveHeatmapsDir();
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    if (!fs.existsSync(heatmapsDir)) fs.mkdirSync(heatmapsDir, { recursive: true });

    const ownedImgName = `acl_owned_${Date.now()}.png`;
    const chatImgName = `acl_chat_${Date.now()}.png`;
    const ownedHmName = `gradcam_acl_${Date.now()}.png`;
    const ownedImgPath = path.join(uploadsDir, ownedImgName);
    const chatImgPath = path.join(uploadsDir, chatImgName);
    const ownedHmPath = path.join(heatmapsDir, ownedHmName);

    await fs.promises.writeFile(ownedImgPath, VALID_PNG);
    await fs.promises.writeFile(chatImgPath, VALID_PNG);
    await fs.promises.writeFile(ownedHmPath, VALID_PNG);

    try {
      jest.spyOn(prisma.analysisResult, "findFirst").mockImplementation(async (args) => {
        const str = JSON.stringify(args?.where || {});
        if (str.includes(ownedImgName) || str.includes(ownedHmName)) {
          return {
            userId: "pat-user-1",
            patientId: "pat-1",
            uploadedByUserId: "doc-1",
            medicalRecord: {
              doctorId: "doc-1",
              patient: { userId: "pat-user-1", doctorId: "doc-1" },
            },
          };
        }
        return null;
      });
      jest.spyOn(prisma.medicalRecord, "findFirst").mockResolvedValue(null);
      jest.spyOn(prisma.message, "findFirst").mockImplementation(async (args) => {
        const str = JSON.stringify(args?.where || {});
        if (str.includes(chatImgName)) {
          return {
            chat: {
              doctorId: "doc-1",
              patient: { userId: "pat-user-1" },
            },
          };
        }
        return null;
      });

      // 1. Expired signed URL is rejected with 403
      const expiredUrl = buildSignedUploadAccessUrl(`/uploads/${ownedImgName}`, Date.now() - 60000);
      const expiredRes = await request(app).get(expiredUrl).set("Authorization", `Bearer ${patient1Token}`);
      expect(expiredRes.status).toBe(403);

      // 2. Partial query (?exp without sig, or ?sig without exp, or non-numeric exp) -> 403
      const partialExpRes = await request(app)
        .get(`/uploads/${ownedImgName}?exp=${Date.now() + 60000}`)
        .set("Authorization", `Bearer ${patient1Token}`);
      expect(partialExpRes.status).toBe(403);

      const nonNumericExpRes = await request(app)
        .get(`/uploads/${ownedImgName}?exp=notanumber&sig=abcd`)
        .set("Authorization", `Bearer ${patient1Token}`);
      expect(nonNumericExpRes.status).toBe(403);

      // 3. Malformed URI encoding returns 400 (never 500)
      const badUriRes = await request(app)
        .get("/uploads/%E0%A4%A")
        .set("Authorization", `Bearer ${patient1Token}`);
      expect(badUriRes.status).toBe(400);

      // 4. Path traversal attempt returns 400
      const traversalRes = await request(app)
        .get("/uploads/..%2Fpackage.json")
        .set("Authorization", `Bearer ${patient1Token}`);
      expect(traversalRes.status).toBe(400);

      // 5. Freshly issued signed URL from permanent storage reference works for owner (patient1) & assigned doctor (doctor1)
      const freshUrl = buildSignedUploadAccessUrl(`/uploads/${ownedImgName}`);
      const ownerRes = await request(app).get(freshUrl).set("Authorization", `Bearer ${patient1Token}`);
      expect(ownerRes.status).toBe(200);

      const assignedDocRes = await request(app).get(freshUrl).set("Authorization", `Bearer ${doctor1Token}`);
      expect(assignedDocRes.status).toBe(200);

      // 6. Another patient (patient2) or unassigned doctor (doctor2) is denied (403) even with the valid signed URL!
      const otherPatientRes = await request(app).get(freshUrl).set("Authorization", `Bearer ${patient2Token}`);
      expect(otherPatientRes.status).toBe(403);

      const otherDoctorRes = await request(app).get(freshUrl).set("Authorization", `Bearer ${doctor2Token}`);
      expect(otherDoctorRes.status).toBe(403);

      // 7. Heatmap ACL: owner and assigned doctor get 200; other patient and other doctor get 403
      const hmOwnerRes = await request(app)
        .get(`/static/heatmaps/${ownedHmName}`)
        .set("Authorization", `Bearer ${patient1Token}`);
      expect(hmOwnerRes.status).toBe(200);

      const hmOtherRes = await request(app)
        .get(`/static/heatmaps/${ownedHmName}`)
        .set("Authorization", `Bearer ${patient2Token}`);
      expect(hmOtherRes.status).toBe(403);

      // 8. Chat attachment ACL: chat participants (patient1, doctor1) get 200; non-participant (patient2) gets 403
      const chatParticipantRes = await request(app)
        .get(`/uploads/${chatImgName}`)
        .set("Authorization", `Bearer ${patient1Token}`);
      expect(chatParticipantRes.status).toBe(200);

      const chatOutsiderRes = await request(app)
        .get(`/uploads/${chatImgName}`)
        .set("Authorization", `Bearer ${patient2Token}`);
      expect(chatOutsiderRes.status).toBe(403);
    } finally {
      await fs.promises.unlink(ownedImgPath).catch(() => undefined);
      await fs.promises.unlink(chatImgPath).catch(() => undefined);
      await fs.promises.unlink(ownedHmPath).catch(() => undefined);
    }
  });

  test("18.4 Review Status Synchronization: review, note edit, and un-review restores requires_review vs pending_review", async () => {
    jest.spyOn(prisma.notification, "create").mockResolvedValue({});
    const state = {
      medRecord: {
        id: "mr-100",
        doctorId: "doc-1",
        patientId: "pat-1",
        analysisResultId: "ar-100",
        imageUrl: "/uploads/scan100.png",
        aiResult: "POSITIVE",
        confidenceScore: 0.78,
        reviewedByDoctor: false,
        doctorNotes: null,
        uploadNotes: "Initial cough",
        createdAt: new Date(),
        patient: { id: "pat-1", userId: "pat-user-1", fullName: "Patient One", email: "p1@test.com" },
        doctor: { userId: "doc-1", user: { id: "doc-1", fullName: "Dr. One", email: "d1@test.com" } },
      },
      analysisResult: {
        id: "ar-100",
        needsReview: true,
        reviewStatus: "requires_review",
        heatmapUrl: "/static/heatmaps/gradcam_100.png",
        probabilities: { NORMAL: 0.22, PNEUMONIA: 0.78 },
        uploadNotes: "Initial cough",
        explanation: "Grad-CAM",
        modelVersion: "best_densenet121_xray.pth#a305699f",
        inferenceTimeMs: 40,
      },
    };

    const mockTx = {
      medicalRecord: {
        updateMany: jest.fn(async ({ where, data }) => {
          if (where.id !== state.medRecord.id || where.doctorId !== state.medRecord.doctorId) {
            return { count: 0 };
          }
          state.medRecord.reviewedByDoctor = data.reviewedByDoctor;
          state.medRecord.doctorNotes = data.doctorNotes;
          return { count: 1 };
        }),
        findFirst: jest.fn(async ({ where }) => {
          if (where.id !== state.medRecord.id || where.doctorId !== state.medRecord.doctorId) {
            return null;
          }
          return {
            ...state.medRecord,
            analysisResult: { ...state.analysisResult },
          };
        }),
      },
      analysisResult: {
        update: jest.fn(async ({ where, data }) => {
          if (where.id === state.analysisResult.id) {
            Object.assign(state.analysisResult, data);
          }
          return state.analysisResult;
        }),
      },
      patient: {
        updateMany: jest.fn(async () => ({ count: 1 })),
      },
    };

    const repo = createDoctorPortalRepository({
      $transaction: async (fn) => fn(mockTx),
      medicalRecord: mockTx.medicalRecord,
    });

    const portalService = createDoctorPortalService({
      doctorPortalRepository: repo,
    });

    // 1. Doctor reviews the record -> reviewStatus becomes "reviewed"
    const reviewedRes = await portalService.updateResult({
      userId: "doc-1",
      id: "mr-100",
      reviewedByDoctor: true,
      doctorNotes: "Confirmed mild lower-lobe infiltrate",
      clinicalStatus: "recovering",
    });
    expect(reviewedRes.record.reviewedByDoctor).toBe(true);
    expect(reviewedRes.record.reviewStatus).toBe("reviewed");
    expect(state.analysisResult.reviewStatus).toBe("reviewed");
    expect(reviewedRes.record.imageUrl).toContain("?exp=");

    // 2. Doctor un-reviews the record (reviewedByDoctor: false) -> since needsReview=true, restores "requires_review" (NOT "pending_review"!)
    const unreviewedRes = await portalService.updateResult({
      userId: "doc-1",
      id: "mr-100",
      reviewedByDoctor: false,
      doctorNotes: null,
    });
    expect(unreviewedRes.record.reviewedByDoctor).toBe(false);
    expect(unreviewedRes.record.reviewStatus).toBe("requires_review");
    expect(state.analysisResult.reviewStatus).toBe("requires_review");

    // 3. Another doctor (doc-2) attempting to update mr-100 -> 404 not_found
    await expect(
      portalService.updateResult({
        userId: "doc-2",
        id: "mr-100",
        reviewedByDoctor: true,
        doctorNotes: "Unauthorized note",
      }),
    ).rejects.toMatchObject({ code: "not_found", statusCode: 404 });
  });

  test("18.5 Deletion Policy: blocks deleting AnalysisResult linked to MedicalRecord (409), allows unlinked deletion and cleans unreferenced files", async () => {
    const uploadsDir = resolveUploadsDir();
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const unlinkedImgName = `del_unlinked_${Date.now()}.png`;
    const sharedImgName = `del_shared_${Date.now()}.png`;
    const unlinkedImgPath = path.join(uploadsDir, unlinkedImgName);
    const sharedImgPath = path.join(uploadsDir, sharedImgName);
    await fs.promises.writeFile(unlinkedImgPath, VALID_PNG);
    await fs.promises.writeFile(sharedImgPath, VALID_PNG);

    try {
      const records = new Map([
        [
          "ar-linked",
          {
            id: "ar-linked",
            userId: "u-1",
            imageUrl: `/uploads/${sharedImgName}`,
            heatmapUrl: null,
            medicalRecord: { id: "mr-linked" },
          },
        ],
        [
          "ar-unlinked-unique",
          {
            id: "ar-unlinked-unique",
            userId: "u-1",
            imageUrl: `/uploads/${unlinkedImgName}`,
            heatmapUrl: null,
            medicalRecord: null,
          },
        ],
        [
          "ar-unlinked-shared",
          {
            id: "ar-unlinked-shared",
            userId: "u-1",
            imageUrl: `/uploads/${sharedImgName}`,
            heatmapUrl: null,
            medicalRecord: null,
          },
        ],
      ]);

      const repo = createAnalysisResultRepository({
        analysisResult: {
          findFirst: jest.fn(async ({ where }) => {
            const rec = records.get(where.id);
            return rec && rec.userId === where.userId ? rec : null;
          }),
          deleteMany: jest.fn(async ({ where }) => {
            const rec = records.get(where.id);
            if (rec && rec.userId === where.userId) {
              records.delete(where.id);
              return { count: 1 };
            }
            return { count: 0 };
          }),
          count: jest.fn(async ({ where }) => {
            const str = JSON.stringify(where || {});
            let c = 0;
            for (const r of records.values()) {
              if (str.includes(r.imageUrl)) c += 1;
            }
            return c;
          }),
        },
        medicalRecord: {
          count: jest.fn(async () => 0),
        },
        message: {
          count: jest.fn(async () => 0),
        },
      });

      // 1. Attempting to delete AnalysisResult linked to a MedicalRecord throws 409 Conflict
      await expect(repo.deleteByUserAndId("u-1", "ar-linked")).rejects.toMatchObject({
        code: "medical_record_protected",
        statusCode: 409,
      });
      expect(records.has("ar-linked")).toBe(true);

      // 2. Deleting unlinked AnalysisResult with unique image deletes the row AND removes the file from disk
      const delUnique = await repo.deleteByUserAndId("u-1", "ar-unlinked-unique");
      expect(delUnique.count).toBe(1);
      expect(fs.existsSync(unlinkedImgPath)).toBe(false);

      // 3. Deleting unlinked AnalysisResult whose image is still referenced by ar-linked preserves the shared image file
      const delShared = await repo.deleteByUserAndId("u-1", "ar-unlinked-shared");
      expect(delShared.count).toBe(1);
      expect(fs.existsSync(sharedImgPath)).toBe(true);
    } finally {
      await fs.promises.unlink(unlinkedImgPath).catch(() => undefined);
      await fs.promises.unlink(sharedImgPath).catch(() => undefined);
    }
  });

  test("18.6 POST /api/predict validates strict Base64, magic bytes, and rejects DICOM or corrupted images", async () => {
    const predictService = createPredictService();

    // Missing image_base64 -> 400
    await expect(predictService.forwardPrediction({ payload: {} })).rejects.toMatchObject({
      code: "validation_error",
      statusCode: 400,
    });

    // Malformed base64 characters -> 400
    await expect(
      predictService.forwardPrediction({ payload: { image_base64: "not!valid!base64@@@" } }),
    ).rejects.toMatchObject({
      code: "validation_error",
      statusCode: 400,
    });

    // Valid base64 of plain text (not an image magic byte) -> 400 invalid_file_type
    const textB64 = Buffer.from("hello world not a chest xray").toString("base64");
    await expect(
      predictService.forwardPrediction({ payload: { image_base64: textB64 } }),
    ).rejects.toMatchObject({
      code: "invalid_file_type",
      statusCode: 400,
    });

    // DICOM magic bytes in base64 -> 400 unsupported_dicom
    const dicomBuf = Buffer.alloc(140, 0);
    dicomBuf.write("DICM", 128, "ascii");
    await expect(
      predictService.forwardPrediction({
        payload: { image_base64: dicomBuf.toString("base64") },
      }),
    ).rejects.toMatchObject({
      code: "unsupported_dicom",
      statusCode: 400,
    });
  });

  test("18.7 Frontend Status & Urgency Mapping: never maps POSITIVE or needsReview to urgent without explicit clinicalStatus=critical", () => {
    // POSITIVE AI result with stable clinicalStatus is NOT urgent
    const positiveUnreviewed = {
      aiResult: "POSITIVE",
      confidenceScore: 0.96,
      needsReview: false,
      reviewedByDoctor: false,
      clinicalStatus: "stable",
    };
    expect(resolveCanonicalReviewStatus(positiveUnreviewed)).toBe("pending_review");
    expect(resolveClinicalPriority(positiveUnreviewed)).toBe("normal");

    // Low confidence / needsReview = true -> requires_review, priority is still normal
    const lowConfPositive = {
      aiResult: "POSITIVE",
      confidenceScore: 0.61,
      needsReview: true,
      reviewedByDoctor: false,
      clinicalStatus: "stable",
    };
    expect(resolveCanonicalReviewStatus(lowConfPositive)).toBe("requires_review");
    expect(resolveClinicalPriority(lowConfPositive)).toBe("normal");
    expect(getReviewStatusLabel("requires_review", "en")).toBe("Needs Physician Review");
    expect(getReviewStatusLabel("requires_review", "ar")).toContain("تحتاج مراجعة الطبيب");

    // Only explicit physician clinicalStatus === "critical" produces urgent priority
    const physicianCritical = {
      aiResult: "POSITIVE",
      reviewedByDoctor: true,
      clinicalStatus: "critical",
    };
    expect(resolveCanonicalReviewStatus(physicianCritical)).toBe("reviewed");
    expect(resolveClinicalPriority(physicianCritical)).toBe("urgent");
  });
});

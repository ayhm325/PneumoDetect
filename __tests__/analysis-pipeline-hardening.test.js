import fs from "fs";
import path from "path";
import crypto from "crypto";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";
import { createApp } from "../apps/api/src/bootstrap/createApp";
import { createAnalysisService, getUploadSigningSecret } from "../apps/api/src/services/analysis/analysisService";
import { isMockEnabled } from "../apps/api/src/ai/inference/index.js";

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
      analysisResultRepository: { save: jest.fn(), findHistoryByUserId: jest.fn(), deleteByUserAndId: jest.fn() },
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
  });

  test("Doctor upload enforces assigned patientId and persists AnalysisResult + MedicalRecord under patient", async () => {
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
      analysisResultRepository: {
        save: saveAnalysis,
        findHistoryByUserId: jest.fn(),
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

    // Valid assigned patient -> persists under patient's userId & creates MedicalRecord
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
    expect(saveAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "pat-user-1" }),
    );
    expect(createMedRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: "pat-assigned",
        doctorId: "doc-1",
        aiResult: "POSITIVE",
      }),
    );

    // Clean up saved PNG created by this test
    const savedName = decodeURIComponent(String(res.data.imageUrl).split("/uploads/")[1].split("?")[0]);
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.promises.unlink(path.join(uploadsDir, savedName)).catch(() => undefined);
  });

  test("Simulated mock output (is_mock: true) is never persisted as a clinical record", async () => {
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
      analysisResultRepository: { save: saveAnalysis, findHistoryByUserId: jest.fn(), deleteByUserAndId: jest.fn() },
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

  test("Signed /uploads middleware rejects expired or tampered HMAC signatures", async () => {
    const app = createApp();
    const token = jwt.sign({ id: "u-1", role: "patient", isActive: true }, SECRET, { expiresIn: "1h" });

    const expiredRes = await request(app)
      .get(`/uploads/test.png?exp=${Date.now() - 10000}&sig=deadbeef`)
      .set("Authorization", `Bearer ${token}`);
    expect(expiredRes.status).toBe(403);

    const futureExp = Date.now() + 60000;
    const tamperedRes = await request(app)
      .get(`/uploads/test.png?exp=${futureExp}&sig=0000000000000000000000000000000000000000000000000000000000000000`)
      .set("Authorization", `Bearer ${token}`);
    expect(tamperedRes.status).toBe(403);

    const validSig = crypto
      .createHmac("sha256", getUploadSigningSecret())
      .update(`nonexistent.png:${futureExp}`)
      .digest("hex");
    const validRes = await request(app)
      .get(`/uploads/nonexistent.png?exp=${futureExp}&sig=${validSig}`)
      .set("Authorization", `Bearer ${token}`);
    // Signature is valid so middleware passes through to express.static (404 because file doesn't exist)
    expect(validRes.status).toBe(404);
  });
});

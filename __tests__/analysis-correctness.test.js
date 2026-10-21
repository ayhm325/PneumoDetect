import { jest } from "@jest/globals";
import { createAnalysisService } from "../src/services/analysis/analysisService";
import { AppError } from "../src/lib/errors/appError";

describe("Analysis Service - AI Prediction, Upload Validation & Persistence Consistency", () => {
  const dummyPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
    0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
    0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
    0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
    0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
    0x60, 0x82,
  ]);

  const mockRepos = () => ({
    runInference: jest.fn(),
    analysisResultRepository: {
      save: jest.fn().mockResolvedValue({ id: "res-1", prediction: "NORMAL" }),
      findHistoryByUserId: jest.fn(),
      deleteByUserAndId: jest.fn(),
    },
    patientRepository: {
      findByUserId: jest.fn().mockResolvedValue({ id: "pat-1", doctorId: "doc-1", fullName: "Test Patient" }),
    },
    medicalRecordRepository: {
      create: jest.fn().mockResolvedValue({ id: "med-1" }),
    },
    notificationRepository: {
      createBestEffort: jest.fn().mockResolvedValue(undefined),
    },
  });

  test("rejects non-image files with invalid_file_type error", async () => {
    const deps = mockRepos();
    const service = createAnalysisService(deps);

    const textBuffer = Buffer.from("this is a text file not an image");

    await expect(
      service.analyzeXray({
        userId: "user-1",
        image: {
          name: "malicious.png",
          type: "image/png",
          buffer: textBuffer,
        },
      })
    ).rejects.toMatchObject({
      code: "invalid_file_type",
      statusCode: 400,
    });

    expect(deps.runInference).not.toHaveBeenCalled();
  });

  test("classifies NORMAL as NEGATIVE and PNEUMONIA as POSITIVE", async () => {
    const deps = mockRepos();
    deps.runInference.mockResolvedValueOnce({
      prediction: "NORMAL",
      confidence: 0.95,
      explanation: "No findings",
    });

    const service = createAnalysisService(deps);
    const result = await service.analyzeXray({
      userId: "user-1",
      image: {
        name: "chest.png",
        type: "image/png",
        buffer: dummyPng,
      },
    });

    expect(result.success).toBe(true);
    expect(result.saved).toBe(true);
    expect(deps.medicalRecordRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        aiResult: "NEGATIVE",
        confidenceScore: 0.95,
      })
    );
  });

  test("rejects unknown or invalid model output instead of defaulting to POSITIVE", async () => {
    const deps = mockRepos();
    deps.runInference.mockResolvedValueOnce({
      prediction: "UNCERTAIN_ANOMALY",
      confidence: 0.45,
    });

    const service = createAnalysisService(deps);

    await expect(
      service.analyzeXray({
        userId: "user-1",
        image: {
          name: "chest.png",
          type: "image/png",
          buffer: dummyPng,
        },
      })
    ).rejects.toMatchObject({
      code: "inference_error",
      statusCode: 502,
    });
  });

  test("persistence failure throws server_error and does not report success", async () => {
    const deps = mockRepos();
    deps.runInference.mockResolvedValueOnce({
      prediction: "PNEUMONIA",
      confidence: 0.92,
    });
    deps.analysisResultRepository.save.mockRejectedValueOnce(new Error("Database connection dropped"));

    const service = createAnalysisService(deps);

    await expect(
      service.analyzeXray({
        userId: "user-1",
        image: {
          name: "chest.png",
          type: "image/png",
          buffer: dummyPng,
        },
      })
    ).rejects.toMatchObject({
      code: "server_error",
      statusCode: 500,
    });
  });
});

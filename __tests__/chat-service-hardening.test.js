import { jest } from "@jest/globals";
import { createChatPatientService } from "../apps/api/src/services/chat/chatPatientService.ts";
import { createChatMessageService } from "../apps/api/src/services/chat/chatMessageService.ts";

describe("Chat Application Services — Authorization, Idempotency & Status", () => {
  function makeMockRepo(overrides = {}) {
    return {
      findActivePatientByUserId: jest.fn(),
      findPatientById: jest.fn(),
      findPatientByUserId: jest.fn(),
      listActivePatientsForDoctor: jest.fn(),
      findChatById: jest.fn(),
      findChatByDoctorAndPatient: jest.fn(),
      createChat: jest.fn(),
      listChatsForPatient: jest.fn(),
      listDoctorChatsWithPatient: jest.fn(),
      listChatsForAdmin: jest.fn(),
      listLastMessagesForChats: jest.fn(),
      groupUnreadDoctorMessages: jest.fn(),
      groupUnreadPatientMessages: jest.fn(),
      groupUnreadAllMessages: jest.fn(),
      listRecentMessages: jest.fn(),
      markUnreadNotificationsAsRead: jest.fn(),
      markMessagesAsRead: jest.fn(),
      findMessagesByIds: jest.fn(),
      markMessagesStatusByIds: jest.fn(),
      findMessageByClientKey: jest.fn(),
      createMessage: jest.fn(),
      touchChat: jest.fn(),
      findPatientUserIdByPatientId: jest.fn(),
      findDoctorUserIdByDoctorId: jest.fn(),
      deleteChatWithMessages: jest.fn(),
      ...overrides,
    };
  }

  test("forbids a doctor from creating a chat with a patient assigned to another doctor", async () => {
    const repo = makeMockRepo({
      findPatientById: jest.fn().mockResolvedValue({
        id: "pat-1",
        userId: "user-pat-1",
        doctorId: "doc-OTHER",
        fullName: "Patient A",
        user: { isActive: true },
      }),
    });

    const service = createChatPatientService({ chatPatientRepository: repo });

    await expect(
      service.createOrGetChat({ userId: "doc-1", role: "doctor", patientId: "pat-1" }),
    ).rejects.toMatchObject({ statusCode: 403, code: "forbidden" });
    expect(repo.createChat).not.toHaveBeenCalled();
  });

  test("allows a doctor to get or create a chat with their assigned patient", async () => {
    const repo = makeMockRepo({
      findPatientById: jest.fn().mockResolvedValue({
        id: "pat-1",
        userId: "user-pat-1",
        doctorId: "doc-1",
        fullName: "Patient A",
        user: { isActive: true },
      }),
      findChatByDoctorAndPatient: jest.fn().mockResolvedValue({
        id: "chat-1",
        doctorId: "doc-1",
        patientId: "pat-1",
      }),
    });

    const service = createChatPatientService({ chatPatientRepository: repo });
    const res = await service.createOrGetChat({
      userId: "doc-1",
      role: "doctor",
      patientId: "pat-1",
    });

    expect(res.created).toBe(false);
    expect(res.chat.id).toBe("chat-1");
  });

  test("rejects empty and over-limit messages", async () => {
    const repo = makeMockRepo({
      findChatById: jest.fn().mockResolvedValue({
        id: "chat-1",
        doctorId: "doc-1",
        patientId: "pat-1",
      }),
    });
    const service = createChatMessageService({ chatPatientRepository: repo });

    await expect(
      service.sendMessage({ userId: "doc-1", role: "doctor", chatId: "chat-1", text: "   " }),
    ).rejects.toMatchObject({ statusCode: 400, message: "empty_message" });

    await expect(
      service.sendMessage({
        userId: "doc-1",
        role: "doctor",
        chatId: "chat-1",
        text: "a".repeat(501),
      }),
    ).rejects.toMatchObject({ statusCode: 400, message: "message_too_long" });
  });

  test("returns existing message on concurrent clientKey unique constraint race", async () => {
    const existingMsg = {
      id: "msg-existing",
      chatId: "chat-1",
      sender: "doctor",
      text: "Hello",
      clientKey: "ck-123",
    };
    const repo = makeMockRepo({
      findChatById: jest.fn().mockResolvedValue({
        id: "chat-1",
        doctorId: "doc-1",
        patientId: "pat-1",
      }),
      findMessageByClientKey: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingMsg),
      createMessage: jest.fn().mockRejectedValue(new Error("Unique constraint failed")),
    });

    const service = createChatMessageService({ chatPatientRepository: repo });
    const res = await service.sendMessage({
      userId: "doc-1",
      role: "doctor",
      chatId: "chat-1",
      text: "Hello",
      clientKey: "ck-123",
    });

    expect(res.existing).toBe(true);
    expect(res.message.id).toBe("msg-existing");
    expect(repo.touchChat).not.toHaveBeenCalled();
  });

  test("markMessagesStatus updates only authorized opponent messages in batch", async () => {
    const repo = makeMockRepo({
      findMessagesByIds: jest.fn().mockResolvedValue([
        { id: "m1", chatId: "chat-1", sender: "patient", status: "sent" },
        { id: "m2", chatId: "chat-1", sender: "doctor", status: "sent" },
        { id: "m3", chatId: "chat-OTHER", sender: "patient", status: "sent" },
      ]),
      findChatById: jest.fn().mockImplementation(async (id) =>
        id === "chat-1"
          ? { id: "chat-1", doctorId: "doc-1", patientId: "pat-1" }
          : { id: "chat-OTHER", doctorId: "doc-OTHER", patientId: "pat-2" },
      ),
    });

    const service = createChatMessageService({ chatPatientRepository: repo });
    const res = await service.markMessagesStatus({
      userId: "doc-1",
      role: "doctor",
      messageIds: ["m1", "m2", "m3"],
      targetStatus: "read",
    });

    expect(res.updated).toEqual([{ id: "m1", chatId: "chat-1", status: "read" }]);
    expect(repo.markMessagesStatusByIds).toHaveBeenCalledWith(["m1"], "read");
  });
});

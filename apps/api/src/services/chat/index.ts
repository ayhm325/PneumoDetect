import { createChatPatientRepository } from "../../repositories/chat/chatPatientRepository";
import { createChatMessageService } from "./chatMessageService";
import { createChatPatientService } from "./chatPatientService";
import { createChatRealtimePublisher } from "./chatRealtimePublisher";
import { createChatUploadService } from "./chatUploadService";

const chatPatientRepository = createChatPatientRepository();
export const chatRealtimePublisher = createChatRealtimePublisher();

export const chatPatientService = createChatPatientService({
  chatPatientRepository,
});

export const chatMessageService = createChatMessageService({
  chatPatientRepository,
  realtimePublisher: chatRealtimePublisher,
});

export const chatUploadService = createChatUploadService({
  chatPatientRepository,
});

import { createChatPatientRepository } from "../../repositories/chat/chatPatientRepository";
import { createChatMessageService } from "./chatMessageService";
import { createChatPatientService } from "./chatPatientService";
import { createChatUploadService } from "./chatUploadService";

const chatPatientRepository = createChatPatientRepository();

export const chatPatientService = createChatPatientService({
  chatPatientRepository,
});

export const chatMessageService = createChatMessageService({
  chatPatientRepository,
});

export const chatUploadService = createChatUploadService({
  chatPatientRepository,
});

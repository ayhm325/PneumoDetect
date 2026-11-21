import { z } from "zod";

export const SendChatMessageSchema = z.object({
  text: z.string().max(4000).optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  clientKey: z.string().optional(),
});
export type SendChatMessage = z.infer<typeof SendChatMessageSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  sender: z.string(),
  text: z.string().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  status: z.string().optional(),
  createdAt: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

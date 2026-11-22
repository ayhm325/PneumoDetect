import type { ChatMessageItem } from "@/components/chat/chatUtils";
import { apiRequest } from "@/lib/apiClient";

export interface ChatParticipantInfo {
  id: string;
  userId?: string;
  fullName?: string;
  email?: string;
  specialty?: string;
  avatarUrl?: string;
}

export interface ChatConversation {
  id: string;
  patientId?: string;
  doctorId?: string;
  patient?: ChatParticipantInfo | null;
  doctor?: ChatParticipantInfo | null;
  messages?: ChatMessageItem[];
  unreadCount: number;
  updatedAt?: string;
}

export async function fetchDoctorChats(): Promise<ChatConversation[]> {
  const data = await apiRequest<{ chats?: ChatConversation[] }>("/api/chat/doctor");
  return Array.isArray(data?.chats) ? data.chats : [];
}

export async function fetchPatientChats(): Promise<ChatConversation[]> {
  const data = await apiRequest<{ chats?: ChatConversation[] }>("/api/chat/patient");
  return Array.isArray(data?.chats) ? data.chats : [];
}

export async function ensurePatientChat(): Promise<ChatConversation | null> {
  const data = await apiRequest<{ chat?: ChatConversation }>("/api/chat/patient", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return data?.chat || null;
}

export async function fetchChatMessages(
  chatId: string,
  opts?: { limit?: number; before?: string },
): Promise<{ messages: ChatMessageItem[]; hasMore: boolean }> {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.before) params.set("before", opts.before);
  const qs = params.toString();
  const data = await apiRequest<{ messages?: ChatMessageItem[]; hasMore?: boolean }>(
    `/api/chat/${encodeURIComponent(chatId)}/messages${qs ? `?${qs}` : ""}`,
  );
  return {
    messages: Array.isArray(data?.messages) ? data.messages : [],
    hasMore: Boolean(data?.hasMore),
  };
}

export async function sendChatMessageRest(
  chatId: string,
  payload: {
    text?: string;
    clientKey?: string;
    fileUrl?: string;
    mimeType?: string;
    fileName?: string;
  },
): Promise<{ message: ChatMessageItem; existing?: boolean }> {
  return apiRequest<{ message: ChatMessageItem; existing?: boolean }>(
    `/api/chat/${encodeURIComponent(chatId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function markChatMessagesReadRest(
  chatId: string,
  messageIds: string[],
): Promise<void> {
  if (!chatId || messageIds.length === 0) return;
  await apiRequest(`/api/chat/${encodeURIComponent(chatId)}/read`, {
    method: "POST",
    body: JSON.stringify({ messageIds: messageIds.slice(0, 100) }),
  }).catch(() => undefined);
}

export async function uploadChatAttachment(
  chatId: string,
  file: File,
): Promise<{
  fileUrl: string;
  mimeType: string;
  fileName: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const data = await apiRequest<{
    fileUrl?: string;
    url?: string;
    mimeType?: string;
    fileName?: string;
  }>(`/api/chat/${encodeURIComponent(chatId)}/upload`, {
    method: "POST",
    body: formData,
  });

  const fileUrl = data?.fileUrl || data?.url || "";
  if (!fileUrl) {
    throw new Error("Upload succeeded without file URL");
  }
  return {
    fileUrl,
    mimeType: data?.mimeType || file.type || "application/octet-stream",
    fileName: data?.fileName || file.name,
  };
}

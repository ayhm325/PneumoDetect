import type { ChatMessageItem } from "@/components/chat/chatUtils";

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

async function parseJsonOrThrow<T>(res: Response, fallbackError: string): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data as { error?: string; message?: string })?.error ||
      (data as { message?: string })?.message ||
      fallbackError;
    throw new Error(msg);
  }
  return data as T;
}

export async function fetchDoctorChats(): Promise<ChatConversation[]> {
  const res = await fetch("/api/chat/doctor", { credentials: "include" });
  const data = await parseJsonOrThrow<{ chats?: ChatConversation[] }>(res, "Failed to load chats");
  return Array.isArray(data.chats) ? data.chats : [];
}

export async function fetchPatientChats(): Promise<ChatConversation[]> {
  const res = await fetch("/api/chat/patient", { credentials: "include" });
  const data = await parseJsonOrThrow<{ chats?: ChatConversation[] }>(res, "Failed to load chats");
  return Array.isArray(data.chats) ? data.chats : [];
}

export async function ensurePatientChat(): Promise<ChatConversation | null> {
  const res = await fetch("/api/chat/patient", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const data = await parseJsonOrThrow<{ chat?: ChatConversation }>(res, "Failed to start chat");
  return data.chat || null;
}

export async function fetchChatMessages(
  chatId: string,
  opts?: { limit?: number; before?: string },
): Promise<{ messages: ChatMessageItem[]; hasMore: boolean }> {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.before) params.set("before", opts.before);
  const qs = params.toString();
  const res = await fetch(
    `/api/chat/${encodeURIComponent(chatId)}/messages${qs ? `?${qs}` : ""}`,
    { credentials: "include" },
  );
  const data = await parseJsonOrThrow<{ messages?: ChatMessageItem[]; hasMore?: boolean }>(
    res,
    "Failed to load messages",
  );
  return {
    messages: Array.isArray(data.messages) ? data.messages : [],
    hasMore: Boolean(data.hasMore),
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
  const res = await fetch(`/api/chat/${encodeURIComponent(chatId)}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<{ message: ChatMessageItem; existing?: boolean }>(
    res,
    "Failed to send message",
  );
}

export async function markChatMessagesReadRest(
  chatId: string,
  messageIds: string[],
): Promise<void> {
  if (!chatId || messageIds.length === 0) return;
  await fetch(`/api/chat/${encodeURIComponent(chatId)}/read`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`/api/chat/${encodeURIComponent(chatId)}/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await parseJsonOrThrow<{
    fileUrl?: string;
    url?: string;
    mimeType?: string;
    fileName?: string;
  }>(res, "Failed to upload file");

  const fileUrl = data.fileUrl || data.url || "";
  if (!fileUrl) {
    throw new Error("Upload succeeded without file URL");
  }
  return {
    fileUrl,
    mimeType: data.mimeType || file.type || "application/octet-stream",
    fileName: data.fileName || file.name,
  };
}

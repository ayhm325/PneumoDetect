export type MessageDeliveryStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface ChatMessageItem {
  id: string;
  chatId?: string;
  sender: "doctor" | "patient";
  text?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  status?: MessageDeliveryStatus;
  createdAt?: string | Date;
  time?: string | Date;
  clientKey?: string | null;
  localStatus?: "sending" | "failed";
}

export function createClientKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ck_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isImageAttachment(
  mimeType?: string | null,
  fileName?: string | null,
  fileUrl?: string | null,
): boolean {
  if (mimeType && mimeType.toLowerCase().startsWith("image/")) return true;
  const candidate = String(fileName || fileUrl || "").toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(candidate);
}

export function isPdfAttachment(
  mimeType?: string | null,
  fileName?: string | null,
  fileUrl?: string | null,
): boolean {
  if (mimeType && mimeType.toLowerCase() === "application/pdf") return true;
  const candidate = String(fileName || fileUrl || "").toLowerCase();
  return /\.pdf(\?|$)/.test(candidate);
}

export function mergeMessages(
  existing: ChatMessageItem[],
  incoming: ChatMessageItem[],
): ChatMessageItem[] {
  const byKey = new Map<string, ChatMessageItem>();

  const getKey = (m: ChatMessageItem) =>
    m.clientKey ? `ck:${m.clientKey}` : `id:${m.id}`;

  for (const item of existing) {
    byKey.set(getKey(item), item);
  }

  for (const item of incoming) {
    const key = getKey(item);
    const prev = byKey.get(key);
    if (prev) {
      byKey.set(key, {
        ...prev,
        ...item,
        localStatus: item.id && !item.id.startsWith("tmp_") ? undefined : item.localStatus,
      });
    } else {
      byKey.set(key, item);
    }
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const ta = new Date(a.createdAt || a.time || 0).getTime();
    const tb = new Date(b.createdAt || b.time || 0).getTime();
    if (ta !== tb) return ta - tb;
    return String(a.id).localeCompare(String(b.id));
  });
}

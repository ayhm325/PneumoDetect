import React from "react";
import { FaPaperclip, FaSearch, FaUserInjured } from "react-icons/fa";
import type { ChatConversation } from "@/features/chat/chatApi";

export interface ConversationListProps {
  conversations: ChatConversation[];
  activeChatId: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectChat: (chatId: string) => void;
  presenceByUserId: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  isAr: boolean;
}

function getInitials(name?: string | null): string {
  const raw = String(name || "").trim();
  if (!raw) return "P";
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return raw.slice(0, 2).toUpperCase();
}

function formatShortTime(raw?: string | Date, isAr = false): string {
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ConversationList({
  conversations,
  activeChatId,
  searchQuery,
  onSearchChange,
  onSelectChat,
  presenceByUserId,
  loading,
  error,
  onRetry,
  isAr,
}: ConversationListProps) {
  const filtered = conversations.filter((conv) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = String(conv.patient?.fullName || conv.doctor?.fullName || "").toLowerCase();
    const email = String(conv.patient?.email || conv.doctor?.email || "").toLowerCase();
    const lastText = String(conv.messages?.[0]?.text || "").toLowerCase();
    return name.includes(q) || email.includes(q) || lastText.includes(q);
  });

  return (
    <aside className="flex h-full flex-col border-e border-[var(--ui-border)] bg-[var(--ui-surface)]">
      <div className="border-b border-[var(--ui-border)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--ui-foreground)]">
            {isAr ? "المحادثات" : "Conversations"}
          </h2>
          <span className="rounded-full bg-[var(--ui-surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ui-muted)]">
            {conversations.length}
          </span>
        </div>

        <div className="relative">
          <FaSearch className="pointer-events-none absolute start-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ui-muted)]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isAr ? "ابحث عن مريض..." : "Search patients..."}
            aria-label={isAr ? "ابحث عن مريض" : "Search patients"}
            className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] py-2 pe-3 ps-9 text-sm text-[var(--ui-foreground)] outline-none transition focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading && conversations.length === 0 ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-[var(--ui-surface-2)]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="mb-2 text-sm text-[var(--ui-danger)]">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl bg-[var(--color-primary-500)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              {isAr ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-[var(--ui-muted)]">
            <FaUserInjured className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">
              {searchQuery
                ? isAr
                  ? "لا توجد نتائج مطابقة"
                  : "No matching conversations"
                : isAr
                  ? "لا توجد محادثات حالياً"
                  : "No conversations yet"}
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {filtered.map((conv) => {
              const peer = conv.patient || conv.doctor;
              const peerName =
                peer?.fullName || peer?.email || (isAr ? "مريض" : "Patient");
              const peerUserId = peer?.userId ? String(peer.userId) : "";
              const isOnline = peerUserId ? Boolean(presenceByUserId[peerUserId]) : false;
              const isActive = conv.id === activeChatId;
              const lastMsg = conv.messages?.[0];
              const lastTime = formatShortTime(lastMsg?.createdAt || lastMsg?.time, isAr);

              return (
                <li key={conv.id}>
                  <button
                    type="button"
                    onClick={() => onSelectChat(conv.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${
                      isActive
                        ? "bg-[var(--color-primary-500)]/12 ring-1 ring-[var(--color-primary-500)]/40"
                        : "hover:bg-[var(--ui-surface-2)]"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-500)]/15 text-sm font-bold text-[var(--color-primary-500)]">
                        {getInitials(peerName)}
                      </div>
                      <span
                        className={`absolute bottom-0 end-0 h-3 w-3 rounded-full ring-2 ring-[var(--ui-surface)] ${
                          isOnline ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                        title={isOnline ? (isAr ? "متصل" : "Online") : isAr ? "غير متصل" : "Offline"}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-[var(--ui-foreground)]">
                          {peerName}
                        </span>
                        {lastTime && (
                          <span className="shrink-0 text-[11px] text-[var(--ui-muted)]">
                            {lastTime}
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1 truncate text-xs text-[var(--ui-muted)]">
                          {lastMsg?.fileUrl && !lastMsg?.text && (
                            <>
                              <FaPaperclip className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {lastMsg.fileName || (isAr ? "مرفق" : "Attachment")}
                              </span>
                            </>
                          )}
                          {lastMsg?.text ? (
                            <span className="truncate">{lastMsg.text}</span>
                          ) : !lastMsg ? (
                            <span className="italic opacity-75">
                              {isAr ? "ابدأ المحادثة" : "Start conversation"}
                            </span>
                          ) : null}
                        </span>

                        {conv.unreadCount > 0 && (
                          <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-500)] px-1.5 text-[11px] font-bold text-white">
                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

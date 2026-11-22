import React, { useEffect, useLayoutEffect, useRef } from "react";
import { FaComments } from "react-icons/fa";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessageItem } from "./chatUtils";

export interface MessageListProps {
  messages: ChatMessageItem[];
  myRole: "doctor" | "patient";
  loading: boolean;
  loadingOlder: boolean;
  hasMore: boolean;
  error: string | null;
  isTyping: boolean;
  onLoadOlder: () => void;
  onRetryMessage: (message: ChatMessageItem) => void;
  isAr: boolean;
}

function getDateKey(raw?: string | Date): string {
  const d = new Date(raw || 0);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function formatDateSeparator(raw?: string | Date, isAr = false): string {
  const d = new Date(raw || 0);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const todayKey = getDateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const key = getDateKey(d);
  if (key === todayKey) return isAr ? "اليوم" : "Today";
  if (key === getDateKey(yesterday)) return isAr ? "أمس" : "Yesterday";
  return d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(raw?: string | Date, isAr = false): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageList({
  messages,
  myRole,
  loading,
  loadingOlder,
  hasMore,
  error,
  isTyping,
  onLoadOlder,
  onRetryMessage,
  isAr,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const wasPrependingRef = useRef<boolean>(false);
  const prevCountRef = useRef<number>(0);

  const handleLoadOlderClick = () => {
    const el = containerRef.current;
    if (el) {
      prevScrollHeightRef.current = el.scrollHeight;
      wasPrependingRef.current = true;
    }
    onLoadOlder();
  };

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (wasPrependingRef.current && !loadingOlder) {
      const diff = el.scrollHeight - prevScrollHeightRef.current;
      if (diff > 0) {
        el.scrollTop = diff;
      }
      wasPrependingRef.current = false;
      prevCountRef.current = messages.length;
      return;
    }

    const addedNewAtEnd = messages.length > prevCountRef.current;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 140;

    if (prevCountRef.current === 0 || (addedNewAtEnd && nearBottom)) {
      el.scrollTop = el.scrollHeight;
    }
    prevCountRef.current = messages.length;
  }, [messages.length, loadingOlder]);

  useEffect(() => {
    if (!isTyping) return;
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 140) {
      el.scrollTop = el.scrollHeight;
    }
  }, [isTyping]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-12 w-56 animate-pulse rounded-2xl bg-[var(--ui-surface-2)] ${
              i % 2 === 0 ? "self-end" : "self-start"
            }`}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-sm font-medium text-[var(--ui-danger)]">{error}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-[var(--ui-muted)]">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ui-surface-2)]">
          <FaComments className="h-6 w-6 opacity-60" />
        </div>
        <p className="text-sm font-semibold text-[var(--ui-foreground)]">
          {isAr ? "لا توجد رسائل بعد" : "No messages yet"}
        </p>
        <p className="mt-1 text-xs">
          {isAr ? "أرسل أول رسالة لبدء المحادثة" : "Send the first message to start the conversation"}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-[var(--ui-surface-2)]/40 p-4 sm:p-5"
    >
      {hasMore && (
        <div className="mb-2 flex justify-center">
          <button
            type="button"
            onClick={handleLoadOlderClick}
            disabled={loadingOlder}
            className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-1.5 text-xs font-semibold text-[var(--ui-foreground)] shadow-2xs transition hover:bg-[var(--ui-surface-2)] disabled:opacity-50"
          >
            {loadingOlder
              ? isAr
                ? "جارٍ التحميل..."
                : "Loading..."
              : isAr
                ? "تحميل رسائل أقدم"
                : "Load older messages"}
          </button>
        </div>
      )}

      {messages.map((msg, index) => {
        const rawDate = msg.createdAt || msg.time;
        const dateKey = getDateKey(rawDate);
        const prevDateKey = index > 0 ? getDateKey(messages[index - 1].createdAt || messages[index - 1].time) : "";
        const showSeparator = dateKey !== prevDateKey && dateKey !== "unknown";

        const key = msg.clientKey ? `ck:${msg.clientKey}` : `id:${msg.id}`;
        const isMine = msg.sender === myRole;

        return (
          <React.Fragment key={key}>
            {showSeparator && (
              <div className="my-2 flex items-center justify-center">
                <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-0.5 text-[11px] font-medium text-[var(--ui-muted)]">
                  {formatDateSeparator(rawDate, isAr)}
                </span>
              </div>
            )}
            <MessageBubble
              message={msg}
              isMine={isMine}
              timeLabel={formatTime(rawDate, isAr)}
              onRetry={onRetryMessage}
              retryLabel={isAr ? "إعادة الإرسال" : "Retry"}
            />
          </React.Fragment>
        );
      })}

      {isTyping && (
        <div className="flex justify-start">
          <div className="inline-flex items-center gap-1 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3.5 py-2 text-xs text-[var(--ui-muted)]">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-primary-500)] [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-primary-500)] [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-primary-500)]" />
          </div>
        </div>
      )}
    </div>
  );
}

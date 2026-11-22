import React from "react";
import { FaArrowLeft, FaArrowRight, FaCircle } from "react-icons/fa";

export interface ChatHeaderProps {
  participantName: string;
  participantSubtitle?: string;
  isOnline: boolean;
  isTyping: boolean;
  connectionStatus: "connected" | "connecting" | "disconnected";
  showBackButton?: boolean;
  onBack?: () => void;
  isAr: boolean;
}

function getInitials(name: string): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return String(name || "U").slice(0, 2).toUpperCase();
}

export function ChatHeader({
  participantName,
  participantSubtitle,
  isOnline,
  isTyping,
  connectionStatus,
  showBackButton = false,
  onBack,
  isAr,
}: ChatHeaderProps) {
  const BackIcon = isAr ? FaArrowRight : FaArrowLeft;

  const statusText = isTyping
    ? isAr
      ? "يكتب الآن..."
      : "Typing..."
    : isOnline
      ? isAr
        ? "متصل الآن"
        : "Online"
      : isAr
        ? "غير متصل"
        : "Offline";

  const connLabel =
    connectionStatus === "connected"
      ? isAr
        ? "متصل"
        : "Live"
      : connectionStatus === "connecting"
        ? isAr
          ? "جارٍ الاتصال..."
          : "Reconnecting..."
        : isAr
          ? "غير متصل بالخادم"
          : "Offline";

  const connDotColor =
    connectionStatus === "connected"
      ? "text-emerald-500"
      : connectionStatus === "connecting"
        ? "text-amber-500"
        : "text-rose-500";

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        {showBackButton && onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={isAr ? "العودة للمحادثات" : "Back to conversations"}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] text-[var(--ui-foreground)] transition hover:bg-[var(--ui-surface)] md:hidden"
          >
            <BackIcon className="h-3.5 w-3.5" />
          </button>
        )}

        <div className="relative shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-500)]/15 text-sm font-bold text-[var(--color-primary-500)]">
            {getInitials(participantName)}
          </div>
          <span
            className={`absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--ui-surface)] ${
              isOnline ? "bg-emerald-500" : "bg-slate-400"
            }`}
          />
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-[var(--ui-foreground)] sm:text-base">
            {participantName}
          </h3>
          <p
            className={`truncate text-xs font-medium ${
              isTyping
                ? "text-[var(--color-primary-500)]"
                : isOnline
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-[var(--ui-muted)]"
            }`}
          >
            {statusText}
            {participantSubtitle && !isTyping ? ` · ${participantSubtitle}` : ""}
          </p>
        </div>
      </div>

      <div
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ui-foreground)]"
        title={connLabel}
      >
        <FaCircle className={`h-2 w-2 ${connDotColor}`} />
        <span>{connLabel}</span>
      </div>
    </header>
  );
}

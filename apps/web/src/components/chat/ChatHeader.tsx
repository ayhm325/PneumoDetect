import { ArrowLeftIcon, ArrowRightIcon, CircleIcon } from "lucide-react";
import React from "react";
import { getInitials } from "@/lib/format";

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
  const BackIcon = isAr ? ArrowRightIcon : ArrowLeftIcon;

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
      ? "text-[var(--pd-success)] fill-[var(--pd-success)]"
      : connectionStatus === "connecting"
        ? "text-[var(--pd-marigold)] fill-[var(--pd-marigold)]"
        : "text-[var(--pd-coral)] fill-[var(--pd-coral)]";

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] px-4 py-3.5 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        {showBackButton && onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={isAr ? "العودة للمحادثات" : "Back to conversations"}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-surface)] text-[var(--pd-text-primary)] transition-colors hover:bg-[var(--pd-surface-raised)] md:hidden"
          >
            <BackIcon size={15} strokeWidth={1.7} />
          </button>
        )}

        <div className="relative shrink-0">
          <div className="pd-orb pd-orb--acid text-xs font-semibold">
            {getInitials(participantName)}
          </div>
          <span
            className={`absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--pd-canvas-raised)] ${
              isOnline ? "bg-[var(--pd-success)]" : "bg-[var(--pd-text-subtle)]"
            }`}
          />
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[var(--pd-text-primary)] sm:text-base">
            {participantName}
          </h3>
          <p
            className={`truncate text-xs font-medium ${
              isTyping
                ? "text-[var(--pd-acid)]"
                : isOnline
                  ? "text-[var(--pd-success)]"
                  : "text-[var(--pd-text-muted)]"
            }`}
          >
            {statusText}
            {participantSubtitle && !isTyping ? ` · ${participantSubtitle}` : ""}
          </p>
        </div>
      </div>

      <div
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--pd-line)] bg-[var(--pd-surface)] px-3 py-1 text-[11px] font-medium text-[var(--pd-text-secondary)]"
        title={connLabel}
      >
        <CircleIcon size={8} className={connDotColor} />
        <span>{connLabel}</span>
      </div>
    </header>
  );
}

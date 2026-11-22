import React from "react";
import { FaFileAlt, FaFilePdf, FaRedo } from "react-icons/fa";
import Image from "@/lib/compat/Image";
import MessageStatusIcon from "./MessageStatusIcon";
import {
  isImageAttachment,
  isPdfAttachment,
  type ChatMessageItem,
} from "./chatUtils";

export interface MessageBubbleProps {
  message: ChatMessageItem;
  isMine: boolean;
  timeLabel: string;
  onRetry?: (message: ChatMessageItem) => void;
  retryLabel?: string;
}

export function MessageBubble({
  message,
  isMine,
  timeLabel,
  onRetry,
  retryLabel = "Retry",
}: MessageBubbleProps) {
  const effectiveStatus = message.localStatus || message.status || "sent";
  const hasFile = Boolean(message.fileUrl);
  const isImage = hasFile && isImageAttachment(message.mimeType, message.fileName, message.fileUrl);
  const isPdf = hasFile && isPdfAttachment(message.mimeType, message.fileName, message.fileUrl);

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-2xs sm:max-w-[68%] ${
          isMine
            ? "rounded-ee-xs bg-[var(--color-primary)] text-white"
            : "rounded-es-xs border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)]"
        }`}
      >
        {hasFile && message.fileUrl && (
          <div className="mb-2">
            {isImage ? (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl border border-white/15"
              >
                <Image
                  src={message.fileUrl}
                  alt={message.fileName || "Attachment"}
                  width={320}
                  height={220}
                  className="max-h-56 w-auto rounded-xl object-cover"
                  unoptimized
                />
              </a>
            ) : (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium underline-offset-2 hover:underline ${
                  isMine ? "bg-white/15 text-white" : "bg-[var(--ui-surface-2)] text-[var(--ui-foreground)]"
                }`}
              >
                {isPdf ? <FaFilePdf className="text-rose-400" /> : <FaFileAlt />}
                <span className="max-w-[200px] truncate">{message.fileName || "Attachment"}</span>
              </a>
            )}
          </div>
        )}

        {message.text ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.text}
          </p>
        ) : null}

        <div
          className={`mt-1.5 flex items-center justify-end gap-1.5 text-[11px] ${
            isMine ? "text-white/80" : "text-[var(--ui-muted)]"
          }`}
        >
          <span>{timeLabel}</span>
          {isMine && <MessageStatusIcon status={effectiveStatus} />}
          {effectiveStatus === "failed" && onRetry && (
            <button
              type="button"
              onClick={() => onRetry(message)}
              className="ms-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold underline hover:opacity-90"
            >
              <FaRedo className="h-2.5 w-2.5" />
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export default MessageBubble;

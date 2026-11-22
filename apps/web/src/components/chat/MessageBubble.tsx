import { FileTextIcon, RotateCwIcon } from "lucide-react";
import React from "react";
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
        style={{
          borderRadius: isMine ? "var(--shape-bubble-out)" : "var(--shape-bubble-in)",
        }}
        className={`max-w-[78%] border px-4 py-2.5 sm:max-w-[68%] ${
          isMine
            ? "border-[color-mix(in_srgb,var(--pd-acid)_30%,transparent)] bg-[var(--pd-surface-raised)] text-[var(--pd-text-primary)]"
            : "border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] text-[var(--pd-text-primary)]"
        }`}
      >
        {hasFile && message.fileUrl && (
          <div className="mb-2">
            {isImage ? (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-[var(--shape-control)] border border-[var(--pd-line)]"
              >
                <Image
                  src={message.fileUrl}
                  alt={message.fileName || "Attachment"}
                  width={320}
                  height={220}
                  className="max-h-56 w-auto object-contain"
                  unoptimized
                />
              </a>
            ) : (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[var(--shape-control)] border border-[var(--pd-line)] bg-[var(--pd-surface)] px-3 py-2 text-xs font-medium text-[var(--pd-text-primary)] underline-offset-2 hover:underline"
              >
                <FileTextIcon
                  size={15}
                  strokeWidth={1.7}
                  className={isPdf ? "text-[var(--pd-coral)]" : "text-[var(--pd-orchid)]"}
                />
                <span className="max-w-[200px] truncate">{message.fileName || "Attachment"}</span>
              </a>
            )}
          </div>
        )}

        {message.text ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--pd-text-primary)]">
            {message.text}
          </p>
        ) : null}

        <div className="pd-tabular mt-1.5 flex items-center justify-end gap-1.5 text-[11px] text-[var(--pd-text-muted)]">
          <span>{timeLabel}</span>
          {isMine && <MessageStatusIcon status={effectiveStatus} />}
          {effectiveStatus === "failed" && onRetry && (
            <button
              type="button"
              onClick={() => onRetry(message)}
              className="ms-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-[var(--pd-coral)] underline hover:opacity-90"
            >
              <RotateCwIcon size={11} strokeWidth={1.7} />
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export default MessageBubble;

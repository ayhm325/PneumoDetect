import { PaperclipIcon, SendHorizontalIcon, XIcon } from "lucide-react";
import React, { useRef, useState } from "react";

const MAX_MESSAGE_CHARS = 500;

export interface MessageComposerProps {
  onSend: (input: { text?: string; file?: File | null }) => Promise<boolean>;
  onTyping: (isTyping: boolean) => void;
  uploading: boolean;
  disabled?: boolean;
  isAr: boolean;
}

export function MessageComposer({
  onSend,
  onTyping,
  uploading,
  disabled = false,
  isAr,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const trimmed = text.trim();
  const overLimit = text.length > MAX_MESSAGE_CHARS;
  const canSend =
    !disabled && !uploading && !submitting && !overLimit && (Boolean(trimmed) || Boolean(selectedFile));

  const submit = async () => {
    if (!canSend) return;
    setSubmitting(true);
    setErrorMsg(null);
    const draftText = text;
    const draftFile = selectedFile;
    try {
      const ok = await onSend({ text: draftText, file: draftFile });
      if (ok) {
        setText("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onTyping(false);
      } else {
        setErrorMsg(isAr ? "تعذر إرسال الرسالة، حاول مجدداً." : "Failed to send message. Please retry.");
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : isAr
            ? "فشل رفع الملف أو إرسال الرسالة"
            : "Upload or send failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className="border-t border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] p-3 sm:p-4">
      {errorMsg && (
        <div className="mb-2 flex items-center justify-between rounded-[var(--shape-control)] border border-[color-mix(in_srgb,var(--pd-coral)_38%,transparent)] bg-[var(--pd-coral-soft)] px-3 py-1.5 text-xs font-medium text-[var(--pd-coral)]">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} aria-label="Dismiss error">
            <XIcon size={13} strokeWidth={1.7} />
          </button>
        </div>
      )}

      {selectedFile && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-[var(--shape-control)] border border-[var(--pd-line)] bg-[var(--pd-surface)] px-3 py-2 text-xs">
          <div className="flex min-w-0 items-center gap-2">
            <PaperclipIcon size={14} strokeWidth={1.7} className="shrink-0 text-[var(--pd-acid)]" />
            <span className="truncate font-medium text-[var(--pd-text-primary)]">
              {selectedFile.name}
            </span>
            <span className="pd-tabular shrink-0 text-[var(--pd-text-muted)]">
              ({Math.max(1, Math.round(selectedFile.size / 1024))} KB)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            aria-label={isAr ? "إزالة المرفق" : "Remove attachment"}
            className="rounded-full p-1 text-[var(--pd-text-muted)] hover:bg-[var(--pd-surface-raised)] hover:text-[var(--pd-text-primary)]"
          >
            <XIcon size={14} strokeWidth={1.7} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setSelectedFile(file);
            setErrorMsg(null);
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || submitting}
          aria-label={isAr ? "إرفاق ملف" : "Attach file"}
          title={isAr ? "إرفاق صورة أو ملف PDF" : "Attach image or PDF"}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-surface)] text-[var(--pd-text-secondary)] transition-colors hover:border-[var(--pd-acid)] hover:text-[var(--pd-acid)] disabled:opacity-50"
        >
          <PaperclipIcon size={17} strokeWidth={1.7} />
        </button>

        <div className="relative flex-1">
          <textarea
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTyping(e.target.value.trim().length > 0);
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              isAr
                ? "اكتب رسالتك هنا... (Enter للإرسال، Shift+Enter لسطر جديد)"
                : "Type a message... (Enter to send, Shift+Enter for new line)"
            }
            aria-label={isAr ? "نص الرسالة" : "Message text"}
            className="pd-field max-h-32 !min-h-[44px] resize-none px-4 py-2.5 text-sm disabled:opacity-50"
          />
          {text.length > MAX_MESSAGE_CHARS - 80 && (
            <span
              className={`pd-tabular absolute bottom-1.5 end-3 text-[10px] font-semibold ${
                overLimit ? "text-[var(--pd-coral)]" : "text-[var(--pd-text-muted)]"
              }`}
            >
              {text.length}/{MAX_MESSAGE_CHARS}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSend}
          aria-label={isAr ? "إرسال" : "Send"}
          className="pd-btn pd-btn--primary shrink-0 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <SendHorizontalIcon size={15} strokeWidth={1.7} />
          <span className="hidden sm:inline">
            {uploading
              ? isAr
                ? "جارٍ الرفع..."
                : "Uploading..."
              : submitting
                ? isAr
                  ? "جارٍ الإرسال..."
                  : "Sending..."
                : isAr
                  ? "إرسال"
                  : "Send"}
          </span>
        </button>
      </div>
    </div>
  );
}

import React, { useRef, useState } from "react";
import { FaPaperclip, FaPaperPlane, FaTimes } from "react-icons/fa";

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
  const canSend = !disabled && !uploading && !submitting && !overLimit && (Boolean(trimmed) || Boolean(selectedFile));

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
    <div className="border-t border-[var(--ui-border)] bg-[var(--ui-surface)] p-3 sm:p-4">
      {errorMsg && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} aria-label="Dismiss error">
            <FaTimes className="h-3 w-3" />
          </button>
        </div>
      )}

      {selectedFile && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3 py-2 text-xs">
          <div className="flex min-w-0 items-center gap-2">
            <FaPaperclip className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary-500)]" />
            <span className="truncate font-medium text-[var(--ui-foreground)]">
              {selectedFile.name}
            </span>
            <span className="shrink-0 text-[var(--ui-muted)]">
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
            className="rounded-lg p-1 text-[var(--ui-muted)] hover:bg-[var(--ui-surface)] hover:text-[var(--ui-foreground)]"
          >
            <FaTimes className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
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
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] text-[var(--ui-foreground)] transition hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-500)] disabled:opacity-50"
        >
          <FaPaperclip className="h-4 w-4" />
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
            className="max-h-32 min-h-[44px] w-full resize-none rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3.5 py-2.5 text-sm text-[var(--ui-foreground)] outline-none transition focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20 disabled:opacity-50"
          />
          {text.length > MAX_MESSAGE_CHARS - 80 && (
            <span
              className={`absolute bottom-1.5 end-2.5 text-[10px] font-semibold ${
                overLimit ? "text-rose-500" : "text-[var(--ui-muted)]"
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
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[var(--color-primary-500)] px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-[var(--color-primary-900)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaPaperPlane className="h-3.5 w-3.5" />
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

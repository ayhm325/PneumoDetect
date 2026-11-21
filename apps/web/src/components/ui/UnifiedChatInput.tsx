import React, { useState } from "react";

export default function UnifiedChatInput({
  onSend,
  placeholder = "اكتب رسالة...",
  buttonLabel = "إرسال",
  disabled = false,
}: {
  onSend: (msg: string) => void;
  placeholder?: string;
  buttonLabel?: string;
  disabled?: boolean;
}) {
  const [msg, setMsg] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (msg.trim() && !disabled) {
      onSend(msg);
      setMsg("");
    }
  };

  return (
    <form
      onSubmit={handleSend}
      className="flex items-center gap-2.5 border-t border-[var(--ui-border)] bg-[var(--ui-surface)] p-3"
    >
      <input
        type="text"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-4 py-2.5 text-sm text-[var(--ui-foreground)] outline-none transition focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-primary-500)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/40 disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 20L21 12L3 4V10L15 12L3 14V20Z" fill="currentColor" />
        </svg>
        <span>{buttonLabel}</span>
      </button>
    </form>
  );
}

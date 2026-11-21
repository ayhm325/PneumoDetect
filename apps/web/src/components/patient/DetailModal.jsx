"use client";

export default function DetailModal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-(--color-neutral)/40"
        onClick={onClose}
      />
      <div className="card-glass relative z-10 w-full max-w-xl rounded-xl border border-(--ui-border) shadow-lg">
        <header className="flex items-center justify-between border-b border-(--ui-border) p-4">
          <h3 className="text-lg font-semibold text-(--ui-foreground)">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md border border-(--ui-border) bg-(--ui-surface-2) px-3 py-1.5 text-sm text-(--ui-foreground) hover:bg-(--ui-surface-2)/70"
          >
            إغلاق
          </button>
        </header>
        <div className="p-4 text-sm text-(--ui-foreground)">{children}</div>
      </div>
    </div>
  );
}
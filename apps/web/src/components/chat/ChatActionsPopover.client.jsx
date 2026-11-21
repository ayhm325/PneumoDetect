"use client";

import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { FaEllipsisV } from "react-icons/fa";
import { useTranslations } from "@/lib/compat/intl";

export default function ChatActionsPopover({
  onDelete,
  confirmText,
  confirmYes,
  confirmNo,
  deleteLabel,
  buttonTitle,
}) {
  const t = useTranslations("chat");

  const resolvedConfirmText = confirmText ?? t("confirmDelete.text");
  const resolvedConfirmYes = confirmYes ?? t("confirmDelete.yes");
  const resolvedConfirmNo = confirmNo ?? t("confirmDelete.no");
  const resolvedDeleteLabel = deleteLabel ?? t("actions.deleteConversation");
  const resolvedButtonTitle = buttonTitle ?? t("actions.more");

  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const buttonRef = useRef(null);
  const popRef = useRef(null);
  const [pos, setPos] = useState(null); // {top,left}

  useEffect(() => {
    function onDoc(e) {
      if (buttonRef.current && buttonRef.current.contains(e.target)) return;
      if (popRef.current && popRef.current.contains(e.target)) return;
      setOpen(false);
      setConfirming(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", () => setOpen(false));
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", () => setOpen(false));
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const btn = buttonRef.current;
    const pop = popRef.current;
    if (!btn || !pop) return;
    const rect = btn.getBoundingClientRect();

    const popW = pop.offsetWidth;
    const popH = pop.offsetHeight;
    const margin = 8;

    // Determine direction from document (RTL support)
    const dir = document.documentElement?.dir || document.body?.dir || "ltr";

    // Preferred horizontal: align popover right edge to button right edge (ltr), opposite for rtl
    let left;
    if (dir === "rtl") {
      left = rect.left; // align left edge with button left
    } else {
      left = rect.right - popW; // align right edge with button right
    }

    // clamp to viewport
    left = Math.max(margin, Math.min(left, window.innerWidth - popW - margin));

    // vertical: prefer below unless not enough space
    let top = rect.bottom + margin;
    if (top + popH > window.innerHeight - margin) {
      // place above
      top = rect.top - popH - margin;
      if (top < margin) top = margin;
    }

    setPos({ top: Math.round(top), left: Math.round(left) });
  }, [open, confirming]);

  const popup = (
    <div
      ref={popRef}
      style={
        pos
          ? {
              position: "fixed",
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              zIndex: 9999,
            }
          : { position: "fixed", visibility: "hidden" }
      }
    >
      <div className="card-glass w-48 rounded-md border border-(--ui-border) shadow-(--shadow-soft)">
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="w-full px-4 py-2 text-right text-sm text-(--ui-danger) hover:bg-(--ui-surface-2)"
          >
            {resolvedDeleteLabel}
          </button>
        ) : (
          <div className="px-4 py-2 text-sm">
            <div className="mb-2 text-(--ui-foreground)">
              {resolvedConfirmText}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="rounded bg-(--ui-surface-2) px-3 py-1 text-sm text-(--ui-foreground)"
              >
                {resolvedConfirmNo}
              </button>
              <button
                onClick={async () => {
                  setOpen(false);
                  setConfirming(false);
                  try {
                    await onDelete();
                  } catch (e) {
                    // caller handles errors
                  }
                }}
                className="rounded bg-(--ui-danger) px-3 py-1 text-sm text-(--ui-danger-foreground)"
              >
                {resolvedConfirmYes}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-2 text-(--ui-muted-foreground) transition-all hover:bg-(--ui-surface-2)"
        title={resolvedButtonTitle}
      >
        <FaEllipsisV />
      </button>
      {open && createPortal(popup, document.body)}
    </div>
  );
}
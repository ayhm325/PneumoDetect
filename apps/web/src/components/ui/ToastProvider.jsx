
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "@/lib/compat/intl";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // إزالة Toast
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // إضافة Toast
  const addToast = useCallback(
    (message, type = "info", duration = 3000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  // اختصارات للأنواع
  const showSuccess = useCallback(
    (msg, duration) => addToast(msg, "success", duration),
    [addToast],
  );
  const showError = useCallback(
    (msg, duration) => addToast(msg, "error", duration),
    [addToast],
  );
  const showWarning = useCallback(
    (msg, duration) => addToast(msg, "warning", duration),
    [addToast],
  );
  const showInfo = useCallback(
    (msg, duration) => addToast(msg, "info", duration),
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

// ----------------------------------------
// ToastContainer: يُعرض بعد تحميل العميل فقط
export function ToastContainer({ toasts, removeToast }) {
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    // Calling setState here is intentional: wait until client hydration completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none"
      dir={dir}
    >
      {(toasts || []).map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>,
    document.body,
  );
}

// ----------------------------------------
// Toast individual
export function Toast({ id, message, type, onClose }) {
  const t = useTranslations("ui");

  const types = {
    success: {
      bg: "bg-(--ui-success) text-(--ui-success-foreground)",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
    error: {
      bg: "bg-(--ui-danger) text-(--ui-danger-foreground)",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },
    warning: {
      bg: "bg-(--ui-warning) text-(--ui-warning-foreground)",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    info: {
      bg: "bg-(--ui-info) text-(--ui-info-foreground)",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const config = types[type] || types.info;

  return (
    <div
      className={`${config.bg} px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 min-w-75 max-w-md pointer-events-auto animate-fadeIn`}
      role="alert"
    >
      <div className="shrink-0">{config.icon}</div>
      <p className="flex-1 font-semibold text-sm">{message}</p>
      <button
        onClick={onClose}
        className="shrink-0 rounded-full p-1 transition-colors hover:bg-(--color-neutral)/10"
        aria-label={t("aria.close")}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
export default ToastProvider;
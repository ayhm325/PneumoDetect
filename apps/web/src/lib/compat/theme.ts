import { useCallback, useSyncExternalStore } from "react";

/**
 * Theme preference.
 *  - "dark"  → Night Fig (default)
 *  - "light" → Warm Clay
 * The public API keeps the historical "light" | "dark" values so existing
 * callers keep working; the document receives `data-theme="night" | "clay"`
 * plus the `.dark` / `.light` class used by Tailwind's `dark:` variant.
 * The choice is persisted in localStorage and shared across every hook instance.
 */
export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "pd-theme";
const listeners = new Set<() => void>();

function readStored(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "clay") return "light";
  } catch {
    /* storage unavailable — fall back to Night Fig */
  }
  return "dark";
}

let current: ThemeMode = typeof window === "undefined" ? "dark" : readStored();

function apply(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(mode);
  root.setAttribute("data-theme", mode === "dark" ? "forest" : "clay");
}

export function initTheme() {
  apply(current);
}

function setThemeGlobal(next: ThemeMode) {
  current = next;
  apply(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, next === "dark" ? "forest" : "clay");
  } catch {
    /* ignore persistence failures */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    () => current,
    () => "dark" as ThemeMode,
  );

  const setTheme = useCallback((next: ThemeMode) => setThemeGlobal(next), []);
  const toggleTheme = useCallback(
    () => setThemeGlobal(current === "dark" ? "light" : "dark"),
    [],
  );

  return { theme, setTheme, toggleTheme };
}

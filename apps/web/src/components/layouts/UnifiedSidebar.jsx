"use client";

import Link from "@/lib/compat/Link";
import { usePathname, useRouter } from "@/lib/compat/navigation";

export default function UnifiedSidebar({ items = [], onLogout, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname?.startsWith("/en") ? "en" : "ar";

  const buildPath = (targetLocale, path = pathname || "/") => {
    const clean = path.replace(/^\/(en|ar)/, "");
    const normalized = clean.startsWith("/") ? clean : `/${clean}`;
    return `/${targetLocale}${normalized}`;
  };

  const handleLogout = () => {
    router.push(buildPath(locale, "/login"));
    onClose?.();
  };

  return (
    <>
      {/* Permanent sidebar on large screens */}
      <aside className="sticky top-4 hidden w-72 shrink-0 rounded-xl card-glass p-4 shadow-sm lg:block">
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const isLogout = item.href === "__logout__";

            if (isLogout) {
              return (
                <button
                  key="logout"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-(--ui-foreground) hover:bg-(--ui-danger-bg)"
                  onClick={handleLogout}
                >
                  <span aria-hidden>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-(--ui-info-bg) border border-(--ui-info-border) text-(--ui-foreground)"
                    : "text-(--ui-foreground) hover:bg-(--ui-surface-2)"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay sidebar */}
      {onClose && (
        <>
          <div
            className="fixed inset-0 z-40 bg-(--color-neutral)/40 lg:hidden"
            onClick={onClose}
          />
          <aside
            className="fixed inset-y-0 right-0 z-50 w-72 rounded-l-xl border border-(--ui-border) bg-(--ui-surface) p-4 shadow-lg transition-transform lg:hidden"
            style={{
              transform:
                typeof onClose === "function"
                  ? "translateX(0)"
                  : "translateX(100%)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold text-(--ui-foreground)">
                ???????
              </div>
              <button
                onClick={onClose}
                className="rounded-md bg-(--ui-surface-2) px-3 py-1.5 text-sm text-(--ui-foreground) hover:bg-(--ui-surface) border border-(--ui-border)"
              >
                ?????
              </button>
            </div>
            <nav className="space-y-1">
              {items.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                const isLogout = item.href === "__logout__";

                if (isLogout) {
                  return (
                    <button
                      key="logout"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-(--ui-foreground) hover:bg-(--ui-danger-bg)"
                      onClick={() => {
                        handleLogout();
                        onClose?.();
                      }}
                    >
                      <span aria-hidden>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-(--ui-info-bg) border border-(--ui-info-border) text-(--ui-foreground)"
                        : "text-(--ui-foreground) hover:bg-(--ui-surface-2)"
                    }`}
                    onClick={onClose}
                  >
                    <span aria-hidden>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}

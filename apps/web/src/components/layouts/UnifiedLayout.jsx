"use client";
import { useState } from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function UnifiedLayout({
  children,
  Sidebar,
  Topbar,
  Breadcrumbs,
  breadcrumbsItems = [],
  rtl = false,
  overlaySidebar = false,
  overlayDefaultOpen = true,
  overlayWidthRem = 16,
}) {
  const [overlayOpen, setOverlayOpen] = useState(overlayDefaultOpen);
  const ui = useTranslations("ui");

  return (
    <div
      className="min-h-screen bg-(--ui-surface) text-(--ui-foreground)"
      dir={rtl ? "rtl" : undefined}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div
          className={`py-4 ${overlaySidebar ? "grid gap-4" : "grid gap-4 lg:grid-cols-[18rem,1fr] lg:gap-6"}`}
        >
          {overlaySidebar ? null : (
            <aside className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto">
              {Sidebar ? <Sidebar /> : null}
            </aside>
          )}
          <div className="space-y-4 relative">
            {overlaySidebar && Sidebar ? (
              <>
                {/* Toggle button */}
                <button
                  type="button"
                  onClick={() => setOverlayOpen((v) => !v)}
                  className="hidden lg:flex fixed right-2 top-4 z-40 items-center gap-2 rounded-lg border border-(--ui-border) bg-(--ui-surface) px-3 py-1.5 text-sm text-(--ui-foreground) shadow-sm hover:bg-(--ui-surface-2)"
                >
                  {overlayOpen ? ui("sidebar.hide") : ui("sidebar.show")}
                </button>
                {/* Clickable backdrop */}
                {overlayOpen && (
                  <div
                    className="hidden lg:block fixed inset-0 z-30 bg-(--color-neutral)/10"
                    onClick={() => setOverlayOpen(false)}
                  />
                )}
                {/* Overlay sidebar */}
                <div
                  className="hidden lg:block fixed right-0 top-0 z-40 h-screen"
                  style={{
                    width: `${overlayWidthRem}rem`,
                    transform: overlayOpen
                      ? "translateX(0)"
                      : "translateX(100%)",
                    transition: "transform 200ms ease",
                  }}
                >
                  <Sidebar />
                </div>
              </>
            ) : null}
            {Topbar ? <Topbar /> : null}
            {Breadcrumbs ? (
              <div>
                <Breadcrumbs items={breadcrumbsItems} />
              </div>
            ) : null}
            <main className="space-y-6 text-base md:text-lg">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}

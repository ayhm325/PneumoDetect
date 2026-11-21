"use client";

import Image from "@/lib/compat/Image";
import { useTranslations } from "@/lib/compat/intl";

export default function UnifiedTopbar({
  userName,
  avatarUrl,
  notificationsCount = 0,
  onSettings,
  onToggleSidebar,
  actions = [], // Array of { label, icon, onClick, variant: 'primary'|'secondary' }
}) {
  const ui = useTranslations("ui");

  return (
    <header className="flex items-center justify-between rounded-xl card-glass p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu */}
        <button
          aria-label={ui("aria.openMenu")}
          onClick={onToggleSidebar}
          className="inline-flex items-center justify-center rounded-md border border-(--ui-border) bg-(--ui-surface) px-3 py-2 text-(--ui-foreground) hover:bg-(--ui-surface-2) lg:hidden"
        >
          ☰
        </button>

        {/* Avatar */}
        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-(--ui-border) bg-(--ui-surface-2)">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={userName || ui("profile.avatarAlt")}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-(--ui-muted-foreground)">
              👤
            </div>
          )}
        </div>

        {/* User name */}
        <div className="text-base font-semibold text-(--ui-foreground)">
          {userName || ui("placeholder")}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        {notificationsCount !== undefined && (
          <button className="relative rounded-md border border-(--ui-border) bg-(--ui-surface) px-3 py-1.5 text-sm text-(--ui-foreground) hover:bg-(--ui-surface-2)">
            {ui("topbar.notifications")}
            {notificationsCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--ui-danger) px-1 text-xs text-(--ui-danger-foreground)">
                {notificationsCount}
              </span>
            )}
          </button>
        )}

        {/* Custom actions */}
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`rounded-md px-3 py-1.5 text-sm ${
              action.variant === "primary"
                ? "btn-gradient"
                : "border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) hover:bg-(--ui-surface-2)"
            }`}
          >
            {action.icon && <span className="mr-1">{action.icon}</span>}
            {action.label}
          </button>
        ))}

        {/* Settings button */}
        {onSettings && (
          <button
            onClick={onSettings}
            className="rounded-md btn-gradient px-3 py-1.5 text-sm"
          >
            {ui("topbar.settings")}
          </button>
        )}
      </div>
    </header>
  );
}
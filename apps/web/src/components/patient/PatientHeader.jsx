"use client";

import Image from "@/lib/compat/Image";
import { useTranslations } from "@/lib/compat/intl";

export default function PatientHeader({
  fullName,
  avatarUrl,
  notificationsCount = 0,
  onSettings,
  onToggleSidebar,
}) {
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  return (
    <header className="card-glass flex items-center justify-between rounded-xl border border-(--ui-border) p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {/* زر همبرغر يظهر على الشاشات الصغيرة */}
        <button
          aria-label={ui("aria.openMenu")}
          onClick={onToggleSidebar}
          className="inline-flex items-center justify-center rounded-md border border-(--ui-border) bg-(--ui-surface) px-3 py-2 text-(--ui-foreground) hover:bg-(--ui-surface-2)/60 lg:hidden"
        >
          ☰
        </button>
        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-(--ui-border) bg-(--ui-surface-2)">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={fullName || ui("profile.avatarAlt")}
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
        <div className="text-base font-semibold text-(--ui-foreground)">
          {fullName || placeholder}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative rounded-md border border-(--ui-border) bg-(--ui-surface) px-3 py-1.5 text-sm text-(--ui-foreground) hover:bg-(--ui-surface-2)/60">
          {ui("topbar.notifications")}
          {notificationsCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--ui-danger) px-1 text-xs text-(--ui-danger-foreground)">
              {notificationsCount}
            </span>
          )}
        </button>
        <button
          onClick={onSettings}
          className="btn-gradient rounded-md px-3 py-1.5 text-sm text-white"
        >
          {ui("topbar.settings")}
        </button>
      </div>
    </header>
  );
}
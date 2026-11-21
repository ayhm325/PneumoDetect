"use client";

import React, { useState } from "react";
import { FaBell, FaTimes } from "react-icons/fa";
import { useTranslations, useLocale } from "@/lib/compat/intl";
import { deserializeLocalizedMessage } from "../../../lib/notifications";

const NotificationBell = ({
  notifications = [],
  onRead = () => {},
  className = "",
  ...props
}) => {
  const t = useTranslations("notifications");
  const tUi = useTranslations("ui");
  const locale = useLocale();

  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !(n.isRead ?? n.read)).length;

  const handleMarkAsRead = (id) => {
    onRead(id);
  };

  const containerClass = ["relative", className].filter(Boolean).join(" ");

  return (
    <div className={containerClass} {...props}>
      {/* Bell Icon */}
      <button
        type="button"
        onClick={() => setShowDropdown((prev) => !prev)}
        className="relative p-2 text-(--ui-muted-foreground) hover:text-(--ui-foreground) transition"
        aria-haspopup="true"
        aria-expanded={showDropdown}
        aria-label={t("title")}
      >
        <FaBell size={20} />

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-(--ui-danger) text-(--ui-danger-foreground) text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-2 bg-(--ui-surface) rounded-lg shadow-2xl z-50 w-96 border border-(--ui-border) max-h-96 overflow-y-auto"
        >
          {/* Header */}
          <div className="p-4 border-b border-(--ui-border) flex justify-between items-center">
            <h3 className="font-bold text-(--ui-foreground)">{t("title")}</h3>
            <button
              type="button"
              onClick={() => setShowDropdown(false)}
              className="text-(--ui-muted-foreground) hover:text-(--ui-foreground)"
              aria-label={tUi("aria.close")}
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="divide-y divide-(--ui-border)">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-(--ui-muted-foreground)">
                {t("noNotifications")}
              </div>
            ) : (
              notifications.map((notif) => {
                const itemIsRead = (notif.isRead ?? notif.read) === true;

                return (
                  <div
                    key={notif.id}
                    role="menuitem"
                    className={`p-4 hover:bg-(--ui-surface-2) transition ${
                      itemIsRead ? "" : "bg-(--ui-info-bg)"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          itemIsRead ? "bg-transparent" : "bg-(--ui-info)"
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-(--ui-foreground) text-sm">
                          {notif.title}
                        </p>

                        <p className="text-(--ui-muted-foreground) text-xs mt-1">
                          {deserializeLocalizedMessage(notif.message, locale)}
                        </p>

                        <p className="text-(--ui-muted-foreground) text-xs mt-2">
                          {notif.time}
                        </p>
                      </div>

                      {!itemIsRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-(--ui-success) text-xs px-2 py-1 rounded-lg hover:bg-(--ui-success-bg)"
                          title={t("markAsRead")}
                        >
                          {t("markAsRead")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-(--ui-border) text-center">
              <button
                type="button"
                className="text-(--ui-info) hover:opacity-90 text-sm font-medium"
              >
                {t("viewAll")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

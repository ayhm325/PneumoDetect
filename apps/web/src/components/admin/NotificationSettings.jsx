import { useState } from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function NotificationSettings() {
  const [enabled, setEnabled] = useState(true);
  const t = useTranslations("adminSettings");
  const title = t("notifications.title");
  const enableLabel = t("notifications.enable");
  return (
    <div className="card-glass rounded-2xl p-8 border border-(--ui-border) max-w-xl mx-auto mt-8">
      <h3 className="font-bold text-xl mb-4 text-(--ui-foreground)">{title}</h3>
      <label className="flex items-center gap-2 text-(--ui-foreground)">
        <input
          type="checkbox"
          checked={enabled}
          onChange={() => setEnabled(!enabled)}
        />
        {enableLabel}
      </label>
    </div>
  );
}

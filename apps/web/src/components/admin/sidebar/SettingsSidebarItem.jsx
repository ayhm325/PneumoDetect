"use client";

import Link from "@/lib/compat/Link";
import { FaCogs } from "react-icons/fa";
import { useTranslations } from "@/lib/compat/intl";
import { withLocale } from "../../../i18n/routing";

export default function SettingsSidebarItem() {
  const t = useTranslations("adminSidebar.nav");

  return (
    <Link
      href={withLocale("/admin/settings")}
      className="flex items-center gap-3 py-2.5 px-4 rounded-xl hover:bg-(--ui-surface-2)/60 font-semibold text-(--ui-foreground) transition group"
    >
      <FaCogs className="text-(--ui-muted-foreground) text-lg group-hover:scale-110 transition-transform" />
      <span>{t("settings")}</span>
    </Link>
  );
}

"use client";

import Link from "@/lib/compat/Link";
import { FaTachometerAlt } from "react-icons/fa";
import { useTranslations } from "@/lib/compat/intl";
import { withLocale } from "../../../i18n/routing";

export default function DashboardSidebarItem() {
  const t = useTranslations("adminSidebar.nav");
  // ...existing code...
  // Use withLocale for locale-aware links

  return (
    <Link
      href={withLocale("/admin/dashboard")}
      className="flex items-center gap-3 py-2.5 px-4 rounded-xl hover:bg-(--ui-surface-2)/60 font-semibold text-(--ui-foreground) transition group"
    >
      <FaTachometerAlt className="text-(--ui-muted-foreground) text-lg group-hover:scale-110 transition-transform" />
      <span>{t("dashboard")}</span>
    </Link>
  );
}
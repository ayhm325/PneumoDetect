"use client";

import Link from "@/lib/compat/Link";
import { FaComments } from "react-icons/fa";
import { useTranslations } from "@/lib/compat/intl";
import { withLocale } from "../../../i18n/routing";

export default function ChatSidebarItem() {
  const t = useTranslations("adminSidebar.nav");

  return (
    <Link
      href={withLocale("/admin/chat")}
      className="flex items-center gap-3 py-2.5 px-4 rounded-xl hover:bg-(--ui-surface-2)/60 font-semibold text-(--ui-foreground) transition group"
    >
      <FaComments className="text-(--ui-muted-foreground) text-lg group-hover:scale-110 transition-transform" />
      <span>{t("chat")}</span>
    </Link>
  );
}

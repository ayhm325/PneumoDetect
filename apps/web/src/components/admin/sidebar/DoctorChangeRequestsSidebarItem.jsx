"use client";
import Link from "@/lib/compat/Link";
import { FaExchangeAlt } from "react-icons/fa";
import { useTranslations } from "@/lib/compat/intl";
import { withLocale } from "../../../i18n/routing";

export default function DoctorChangeRequestsSidebarItem() {
  const t = useTranslations("adminSidebar.nav");

  return (
    <Link
      href={withLocale("/admin/doctor-change-requests-page")}
      className="flex items-center gap-3 py-2.5 px-4 rounded-xl hover:bg-(--ui-surface-2)/60 font-semibold text-(--ui-foreground) transition group"
    >
      <FaExchangeAlt className="text-(--ui-muted-foreground)" />
      <span>{t("doctorChangeRequests")}</span>
    </Link>
  );
}

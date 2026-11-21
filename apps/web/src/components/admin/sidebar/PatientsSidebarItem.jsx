"use client";

import Link from "@/lib/compat/Link";
import { FaUserInjured } from "react-icons/fa";
import { useTranslations } from "@/lib/compat/intl";
import { withLocale } from "../../../i18n/routing";

const PatientsSidebarItem = () => {
  const t = useTranslations("adminSidebar.nav");
  // ...existing code...

  return (
    <Link
      href={withLocale("/admin/patients")}
      className="flex items-center gap-3 py-2.5 px-4 rounded-xl hover:bg-(--ui-surface-2)/60 font-semibold text-(--ui-foreground) transition group"
    >
      <FaUserInjured className="text-(--ui-muted-foreground) text-lg group-hover:scale-110 transition-transform" />
      <span>{t("patients")}</span>
    </Link>
  );
};

export default PatientsSidebarItem;

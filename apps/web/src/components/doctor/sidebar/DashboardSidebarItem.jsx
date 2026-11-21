"use client";

import Link from "@/lib/compat/Link";
import { usePathname } from "@/lib/compat/navigation";
import { useTranslations } from "@/lib/compat/intl";

export default function DashboardSidebarItem() {
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "ar";
  const basePrefix = locale === "en" ? "/en" : "/ar";
  const t = useTranslations("doctorSidebar");

  return (
    <Link
      href={`${basePrefix}/doctor/dashboard`}
      className="py-2 px-4 rounded hover:bg-(--ui-surface-2) font-medium block"
    >
      {t("dashboard")}
    </Link>
  );
}
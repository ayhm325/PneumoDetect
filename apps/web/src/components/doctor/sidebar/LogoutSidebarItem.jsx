"use client";

import Link from "@/lib/compat/Link";
import { usePathname } from "@/lib/compat/navigation";
import { useTranslations } from "@/lib/compat/intl";

export default function LogoutSidebarItem() {
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "ar";
  const basePrefix = locale === "en" ? "/en" : "/ar";
  const t = useTranslations("doctorSidebar");

  return (
    <Link
      href={`${basePrefix}/doctor/logout`}
      className="py-2 px-4 rounded text-(--ui-danger) hover:bg-(--ui-danger-bg) font-medium block"
    >
      {t("logout")}
    </Link>
  );
}
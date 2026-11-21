"use client";

import Link from "@/lib/compat/Link";
import { usePathname } from "@/lib/compat/navigation";

export default function UploadXRaySidebarItem() {
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "ar";
  const basePrefix = locale === "en" ? "/en" : "/ar";

  // Navigation only, upload logic is unified in FileUpload.js
  return (
    <Link
      href={`${basePrefix}/patient/analysis`}
      className="py-2 px-4 rounded hover:bg-(--ui-surface-2)/60 font-medium block text-(--ui-foreground)"
    >
      Analysis
    </Link>
  );
}
"use client";

import Link from "@/lib/compat/Link";
import { usePathname } from "@/lib/compat/navigation";

export default function ChatSidebarItem() {
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "ar";
  const basePrefix = locale === "en" ? "/en" : "/ar";

  return (
    <Link
      href={`${basePrefix}/patient/chat`}
      className="py-2 px-4 rounded hover:bg-(--ui-surface-2)/60 font-medium block text-(--ui-foreground)"
    >
      Chat with Doctor
    </Link>
  );
}
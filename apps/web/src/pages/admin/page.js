"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "@/lib/compat/navigation";

export default function AdminHomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "ar";
  const basePrefix = locale === "en" ? "/en" : "/ar";

  useEffect(() => {
    router.replace(`${basePrefix}/admin/dashboard`);
  }, [router, basePrefix]);

  return null;
}
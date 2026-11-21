"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "@/lib/compat/navigation";

export default function LogoutPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "ar";
  const basePrefix = locale === "en" ? "/en" : "/ar";

  useEffect(() => {
    // Clear admin session data
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      sessionStorage.clear();
    }
    // Redirect to homepage
    router.replace(basePrefix);
  }, [router, basePrefix]);
  return null;
}
"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "@/lib/compat/navigation";
import { apiRequest } from "@/lib/apiClient";

export default function PatientLogoutPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "ar";
  const basePrefix = locale === "en" ? "/en" : "/ar";

  useEffect(() => {
    (async () => {
      try {
        await apiRequest("/api/auth/logout", {
          method: "POST",
        }).catch(() => {});
      } finally {
        if (typeof window !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();
        }
        router.replace(basePrefix);
      }
    })();
  }, [router, basePrefix]);
  return null;
}
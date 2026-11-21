"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "@/lib/compat/navigation";

export default function PatientLogoutPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "ar";
  const basePrefix = locale === "en" ? "/en" : "/ar";

  useEffect(() => {
    (async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            : { "Content-Type": "application/json" },
          body: token ? JSON.stringify({ token }) : undefined,
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
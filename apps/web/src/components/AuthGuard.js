"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "@/lib/compat/navigation";
import { apiFetch } from "@/lib/apiClient";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    // Detect protected routes (with or without locale prefix)
    const protectedRe = /^\/(?:en|ar)?\/?(?:admin|doctor|patient)(?:\/|$)/;
    if (!protectedRe.test(pathname)) return;

    (async () => {
      try {
        const res = await apiFetch("/api/auth/whoami", {
          cache: "no-store",
        });
        if (!res.ok) {
          const localePrefix = pathname.startsWith("/en") ? "/en" : "/ar";
          router.replace(`${localePrefix}/login`);
        }
      } catch (e) {
        // On error, redirect to login as a safe fallback
        const localePrefix = pathname.startsWith("/en") ? "/en" : "/ar";
        router.replace(`${localePrefix}/login`);
      }
    })();
  }, [pathname, router]);
  return children;
}
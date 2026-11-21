"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "@/lib/compat/navigation";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    // Detect protected routes (with or without locale prefix)
    const protectedRe = /^\/(?:en|ar)?\/?(?:admin|doctor|patient)(?:\/|$)/;
    if (!protectedRe.test(pathname)) return;

    (async () => {
      try {
        const res = await fetch("/api/auth/whoami", {
          cache: "no-store",
          credentials: "include",
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
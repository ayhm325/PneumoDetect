"use client";
import { useRouter } from "@/lib/compat/navigation";

export default function LogoutSidebarItem() {
  const router = useRouter();

  const handleLogout = () => {
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
        router.replace("/ar");
      }
    })();
  };

  return (
    <button
      onClick={handleLogout}
      className="py-2 px-4 rounded text-(--ui-danger) hover:bg-(--ui-danger)/10 font-medium block w-full text-right"
    >
      Logout
    </button>
  );
}

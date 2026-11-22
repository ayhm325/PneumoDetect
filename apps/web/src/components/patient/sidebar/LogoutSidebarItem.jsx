"use client";
import { useRouter } from "@/lib/compat/navigation";
import { apiRequest } from "@/lib/apiClient";

export default function LogoutSidebarItem() {
  const router = useRouter();

  const handleLogout = () => {
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
"use client";

import { useCallback, useState } from "react";
import { apiGet } from "../lib/api";

type CurrentUser = {
  id: string;
  role: "admin" | "doctor" | "patient";
  email?: string;
};

export function useAuth() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCurrentUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<CurrentUser>("/api/auth/whoami", {
        cache: "no-store",
      });
      setUser(response);
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    setUser,
    loading,
    refreshCurrentUser,
  };
}

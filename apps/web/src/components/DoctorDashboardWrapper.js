"use client";
import { useEffect } from "react";
import { useRouter } from "@/lib/compat/navigation";

export default function DoctorDashboardWrapper({ children }) {
  const router = useRouter();
  useEffect(() => {
    router.refresh();
  }, [router]);
  return children;
}
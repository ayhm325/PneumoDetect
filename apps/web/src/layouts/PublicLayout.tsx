import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-[var(--ui-surface-2)] text-[var(--ui-foreground)]">
      <Navbar />
      <main className="flex-1 pt-3">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

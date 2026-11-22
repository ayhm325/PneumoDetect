import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--pd-canvas)] text-[var(--pd-text-primary)]">
      <Navbar />
      <main className="flex-1 pt-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

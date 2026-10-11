"use client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ModernHomeContent from "../components/home/ModernHomeContent";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <ModernHomeContent />
      <Footer />
    </div>
  );
}

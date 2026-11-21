import SidebarNavigation from "@/components/patient/SidebarNavigation";

export default function PatientLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-(--ui-surface) text-(--ui-foreground)">
      <SidebarNavigation />
      <main className="flex-1">{children}</main>
    </div>
  );
}
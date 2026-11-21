import DashboardSidebarItem from "./sidebar/DashboardSidebarItem";
import PatientsSidebarItem from "./sidebar/PatientsSidebarItem";
import UploadXRaySidebarItem from "./sidebar/UploadXRaySidebarItem";
import ChatSidebarItem from "./sidebar/ChatSidebarItem";
import ResultsSidebarItem from "./sidebar/ResultsSidebarItem";
import SettingsSidebarItem from "./sidebar/SettingsSidebarItem";
import LogoutSidebarItem from "./sidebar/LogoutSidebarItem";

export default function SidebarNavigation() {
  return (
    <aside className="w-full md:w-60 bg-(--ui-surface) border-r border-(--ui-border) h-full flex flex-col p-4 gap-2">
      <nav className="flex flex-col gap-2">
        <DashboardSidebarItem />
        <PatientsSidebarItem />
        <UploadXRaySidebarItem />
        <ChatSidebarItem />
        <ResultsSidebarItem />
        <SettingsSidebarItem />
        <LogoutSidebarItem />
      </nav>
    </aside>
  );
}

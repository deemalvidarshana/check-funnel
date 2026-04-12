import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";

function MainLayoutContent() {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <Sidebar collapsed={isCollapsed} onToggle={toggleSidebar} />

      {/* content starts exactly after sidebar */}
      <main 
        className={`min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:pl-20" : "lg:pl-72"
        }`}
      >
        <div className="p-6 sm:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function MainLayout() {
  return (
    <SidebarProvider>
      <MainLayoutContent />
    </SidebarProvider>
  );
}
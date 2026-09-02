import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";

function MainLayoutContent() {
  const { isCollapsed, toggleSidebar, isMobileOpen, toggleMobileMenu, setIsMobileOpen } = useSidebar();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location, setIsMobileOpen]);

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-[50] flex items-center justify-between px-6 lg:hidden">
        <span className="font-extrabold text-xl tracking-tight text-blue-900">
          Check Funnel
        </span>
        <button 
          onClick={toggleMobileMenu}
          className="p-2 text-slate-500 hover:text-blue-700 transition-colors"
        >
          {isMobileOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>
      </header>

      <Sidebar collapsed={isCollapsed} onToggle={toggleSidebar} />

      {/* content starts exactly after sidebar */}
      <main 
        className={`min-h-screen min-w-0 transition-all duration-300 ease-in-out pt-16 lg:pt-0 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-20 2xl:pl-64"
        }`}
      >
        <div className="min-w-0 p-4 sm:p-6 lg:p-6 xl:p-8 2xl:p-10">
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

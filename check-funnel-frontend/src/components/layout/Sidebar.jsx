import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";
import ProfileAvatarUploadModal from "../../components/profile/ProfileAvatarUploadModal";

// ---------------- Icon Components ----------------
function OverviewIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="13" y="3" width="8" height="5" rx="2" fill="currentColor" opacity="0.7" />
      <rect x="13" y="10" width="8" height="11" rx="2" fill="currentColor" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function SocialIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M7.9 10.9l8.2-3.8M7.9 13.1l8.2 3.8" strokeLinecap="round" />
    </svg>
  );
}

function CompetitorIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 18L10 12L14 15L20 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 7h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SeoIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.2-4.2" strokeLinecap="round" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3h6l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
      <path d="M14 3v6h6" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h4" strokeLinecap="round" />
    </svg>
  );
}

function ClientsIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3" />
      <path d="M4 19a5 5 0 0 1 10 0" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" opacity="0.7" />
      <path d="M15 19a4 4 0 0 1 5 0" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ManageIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </svg>
  );
}

function ChevronIcon({ direction = "left" }) {
  return (
    <svg 
      className={`w-4 h-4 transition-transform duration-300 ${direction === "right" ? "rotate-180" : ""}`} 
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    >
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
       <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------- Toast Component ----------------
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const borderColor = type === "success" ? "border-[#0f3d91]" : "border-red-500";
  const iconColor = type === "success" ? "text-[#0f3d91]" : "text-red-500";

  return (
    <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-4 py-3 rounded-xl bg-white border-l-4 ${borderColor} shadow-xl animate-in slide-in-from-top-4 duration-300`}>
       <div className={`${iconColor}`}>
         {type === "success" ? (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
           </svg>
         ) : (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
           </svg>
         )}
       </div>
       <p className="text-sm font-semibold text-slate-700 tracking-tight">{message}</p>
    </div>
  );
}

// ---------------- Navigation Items ----------------
const navItems = [
  { name: "Overview", path: "/dashboard", icon: <OverviewIcon /> },
  { name: "Content Calendar", path: "/content-calendar", icon: <CalendarIcon /> },
  { name: "Social Media", path: "/social-media", icon: <SocialIcon /> },
  { name: "Competitors", path: "/competitors", icon: <CompetitorIcon /> },
  { name: "SEO", path: "/seo", icon: <SeoIcon /> },
  { name: "Reporting", path: "/reports", icon: <ReportIcon /> },
  { name: "Clients", path: "/clients", icon: <ClientsIcon /> },
  { name: "Manage Users", path: "/users", icon: <ManageIcon />, adminOnly: true },
];

// ---------------- Sidebar Component ----------------
export default function Sidebar() {
  const { isCollapsed, toggleSidebar, isMobileOpen, setIsMobileOpen } = useSidebar();
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [toast, setToast] = useState(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data", error);
      }
    }
  }, []);

  // Handle outside click to close profile menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setToast({ message: "Signing out. Please wait...", type: "success" });
    setIsProfileOpen(false);
    
    // Smooth delay before redirect for the user to see the toast
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }, 1200);
  };

  const handleAvatarUploadSuccess = () => {
    setAvatarTimestamp(Date.now());
    setToast({ message: "Profile photo updated successfully!", type: "success" });
  };

  const getAvatarUrl = () => {
    if (!user?.id) return "https://lh3.googleusercontent.com/aida-public/AB6AXuA3RQRrLT1pfQt2CFGd3fDM0sBKglHZFN84Ji_1QUGgxChBmnV32O4-AswGFR1mtk7tWB1IK2LjN5gt0gpei315mlWuLtURI39ub7oxCkR31rB60m2mV9Yskw7KHln3M671BaaQFEBcyDugy072vvrtC7o4uOM2fvqUN9FgBsh3hRBjH6gi26KcUQkmWzptw74GdFiJzd-0WVSgPSm-OwEVzq1tvNoxRR9eQxHBXUlrVifq_xlfbWvQFt8Vo_AahiMgv-kfKLOoy4FP";
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${apiBase}/user/${user.id}/avatar?t=${avatarTimestamp}`;
  };

  return (
    <>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside 
        className={`fixed left-0 top-0 h-screen bg-slate-50 border-r border-slate-200 z-[60] py-8 transition-all duration-300 ease-in-out flex flex-col ${
          isCollapsed ? "lg:w-20" : "lg:w-72"
        } ${
          isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Toggle Button (Desktop Only) */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-10 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-blue-700 hover:border-blue-200 z-50"
        >
          <ChevronIcon direction={isCollapsed ? "right" : "left"} />
        </button>

        {/* Brand */}
        <div className={`px-6 mb-10 transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? "opacity-0 invisible h-0" : "opacity-100 visible"}`}>
          <h2 className="font-extrabold text-2xl tracking-tight text-blue-900">
            Check Funnel
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Marketing Intelligence
          </p>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col gap-2 px-3 overflow-y-auto no-scrollbar">
          {navItems
            .filter(item => !item.adminOnly || user?.role === "admin")
            .map((item) => (
              <NavLink
                key={`${item.name}-${item.path}`}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? "justify-center gap-0" : "gap-4 px-3.5"} py-3 text-sm font-semibold rounded-xl transition-all ${
                    isActive
                      ? "bg-white text-blue-700 shadow-md ring-1 ring-slate-200"
                      : "text-slate-500 hover:bg-blue-50/50 hover:text-blue-900"
                  }`
                }
                title={isCollapsed ? item.name : ""}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? "w-0 opacity-0 invisible" : "w-auto opacity-100 visible"}`}>
                  {item.name}
                </span>
              </NavLink>
            ))}
        </div>

        {/* Profile Section */}
        <div className="mt-auto px-3 relative" ref={profileRef}>
          {/* Profile Popover Menu */}
          {isProfileOpen && (
            <div className={`absolute bottom-full mb-3 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300 ${isCollapsed ? "left-0 w-48" : "left-0 right-0"}`}>
               <div className="px-3 py-2 border-b border-slate-50 mb-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Session</p>
                  <div className="mt-2 flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 text-xs font-bold">
                        {user?.fullName?.charAt(0) || "U"}
                     </div>
                     <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.fullName || "User"}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                     </div>
                  </div>
               </div>
               
               <button
                 onClick={handleLogout}
                 className="w-full flex items-center gap-3 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-all group"
               >
                  <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                     <LogoutIcon />
                  </div>
                  <span>Sign Out</span>
               </button>
            </div>
          )}

          <div 
            className={`bg-white rounded-xl border border-slate-200 p-2 shadow-sm flex items-center overflow-hidden transition-all duration-300 group ${isCollapsed ? "justify-center gap-0" : "gap-2"}`}
          >
            {/* Avatar - Clickable for upload */}
            <div 
              onClick={() => setIsAvatarModalOpen(true)}
              className={`w-10 h-10 rounded-full overflow-hidden border border-blue-100 shrink-0 transition-all cursor-pointer relative group/avatar hover:ring-4 hover:ring-blue-50 ${isProfileOpen ? "ring-4 ring-blue-50" : ""}`}
            >
              <img
                src={getAvatarUrl()}
                onError={(e) => {
                   e.target.onerror = null;
                   e.target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuA3RQRrLT1pfQt2CFGd3fDM0sBKglHZFN84Ji_1QUGgxChBmnV32O4-AswGFR1mtk7tWB1IK2LjN5gt0gpei315mlWuLtURI39ub7oxCkR31rB60m2mV9Yskw7KHln3M671BaaQFEBcyDugy072vvrtC7o4uOM2fvqUN9FgBsh3hRBjH6gi26KcUQkmWzptw74GdFiJzd-0WVSgPSm-OwEVzq1tvNoxRR9eQxHBXUlrVifq_xlfbWvQFt8Vo_AahiMgv-kfKLOoy4FP";
                }}
                alt="User avatar"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                 <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                 </svg>
              </div>
            </div>

            {/* User Info - Clickable for menu */}
            <div 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`min-w-0 flex-1 transition-all duration-300 cursor-pointer ${isCollapsed ? "w-0 opacity-0 invisible" : "w-auto opacity-100 visible"}`}
            >
              <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-900">
                {user?.fullName || "Guest User"}
              </p>
              <p className="text-xs text-slate-500 truncate lowercase font-medium group-hover:text-blue-700">
                {user?.email || "guest@checkfunnel.com"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <ProfileAvatarUploadModal 
        open={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onUploadSuccess={handleAvatarUploadSuccess}
      />
    </>
  );
}

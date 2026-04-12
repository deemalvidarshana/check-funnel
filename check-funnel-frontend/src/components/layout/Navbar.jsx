import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="flex justify-between items-center w-full px-6 lg:px-8 py-4 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-8">
          <span className="text-xl font-extrabold tracking-tight text-blue-900">
            Check Funnel
          </span>

          <nav className="hidden md:flex items-center gap-6">
            <NavLink className="font-semibold text-sm text-blue-700 border-b-2 border-blue-700 pb-1" to="/dashboard">
              Overview
            </NavLink>
            <NavLink className="font-semibold text-sm text-slate-500 hover:text-blue-900 transition-colors" to="/social-media">
              Social Media
            </NavLink>
            <a className="font-semibold text-sm text-slate-500 hover:text-blue-900 transition-colors" href="#">
              Competitors
            </a>
            <a className="font-semibold text-sm text-slate-500 hover:text-blue-900 transition-colors" href="#">
              SEO
            </a>
            <NavLink className="font-semibold text-sm text-slate-500 hover:text-blue-900 transition-colors" to="/reports">
              Reporting
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-all duration-300">
            🔔
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-all duration-300">
            ⚙️
          </button>

          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-200">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3RQRrLT1pfQt2CFGd3fDM0sBKglHZFN84Ji_1QUGgxChBmnV32O4-AswGFR1mtk7tWB1IK2LjN5gt0gpei315mlWuLtURI39ub7oxCkR31rB60m2mV9Yskw7KHln3M671BaaQFEBcyDugy072vvrtC7o4uOM2fvqUN9FgBsh3hRBjH6gi26KcUQkmWzptw74GdFiJzd-0WVSgPSm-OwEVzq1tvNoxRR9eQxHBXUlrVifq_xlfbWvQFt8Vo_AahiMgv-kfKLOoy4FP"
              alt="User avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
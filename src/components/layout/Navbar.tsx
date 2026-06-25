import React from "react";
import { useAuthStore } from "../../stores/authStore";
import { Shield, Calendar, LogOut, PlusCircle, LayoutDashboard, Settings as SettingsIcon } from "lucide-react";

interface NavbarProps {
  currentPath: string;
  setPage: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, setPage }) => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    setPage("login");
  };

  return (
    <nav className="border-b border-indigo-950/40 bg-[#060A14]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => setPage("dashboard")}
          >
            <div className="p-1.5 bg-indigo-950/50 rounded-lg border border-indigo-500/25 group-hover:border-indigo-400 transition-all">
              <Shield className="w-5.5 h-5.5 text-indigo-400" />
            </div>
            <span className="font-sans font-bold tracking-tight text-lg text-slate-100 group-hover:text-white transition-all">
              Deadline Guardian <span className="text-indigo-400 font-medium text-sm">AI</span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setPage("dashboard")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentPath === "dashboard"
                  ? "bg-indigo-950/40 text-indigo-300 border border-indigo-500/15"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/30"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setPage("create-goal")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentPath === "create-goal"
                  ? "bg-indigo-950/40 text-indigo-300 border border-indigo-500/15"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/30"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              New Goal
            </button>
            <button
              onClick={() => setPage("settings")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentPath === "settings"
                  ? "bg-indigo-950/40 text-indigo-300 border border-indigo-500/15"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/30"
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </button>
          </div>

          {/* Right profile / logout details */}
          <div className="flex items-center gap-4">
            {/* Calendar Connection Status */}
            {user?.googleCalendarConnected ? (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Calendar Connected
              </div>
            ) : (
              <div 
                onClick={() => setPage("settings")}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/30 text-slate-400 text-xs font-mono cursor-pointer hover:border-indigo-500/30 transition-all"
              >
                <Calendar className="w-3 h-3 text-slate-500" />
                Calendar Disabled
              </div>
            )}

            {/* Profile pill */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200">{user?.name}</span>
                <span className="text-[10px] font-mono text-slate-500">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out of Guardian Console"
                className="p-1.5 hover:bg-red-950/20 rounded-lg text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/15 transition-all"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

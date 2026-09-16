import React from 'react';
import { Building2, Wifi, User, Menu } from 'lucide-react';

interface TopBarProps {
  onOpenMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu }) => {
  return (
    <header
      id="main-topbar"
      className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 shadow-2xs max-w-full overflow-x-hidden"
    >
      {/* Left / Operational Info */}
      <div className="flex items-center space-x-3 sm:space-x-5 min-w-0">
        {/* Mobile menu toggle */}
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden cursor-pointer shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Warehouse */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-600 truncate">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400 font-medium hidden xs:inline">Warehouse:</span>
          <span className="font-bold text-slate-900 truncate">Bengaluru DC</span>
        </div>

        <div className="h-4 w-px bg-slate-200 shrink-0" />

        {/* Status */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-600 shrink-0">
          <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-slate-400 font-medium hidden xs:inline">Status:</span>
          <span className="inline-flex items-center space-x-1 font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected</span>
          </span>
        </div>
      </div>

      {/* Right / User */}
      <div className="flex items-center space-x-1.5 text-xs text-slate-600 shrink-0">
        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-400 font-medium hidden sm:inline">User:</span>
        <span className="font-semibold text-slate-900">Warehouse Supervisor</span>
      </div>
    </header>
  );
};

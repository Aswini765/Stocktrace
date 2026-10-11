import React from 'react';
import {
  Menu,
  BookOpen,
  MapPin,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AppRole } from '../types';

interface TopBarProps {
  currentRole: AppRole;
  onSelectRole: (role: AppRole) => void;
  onOpenMobileMenu?: () => void;
  onOpenSopModal?: () => void;
  onOpenRoadmapModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentRole,
  onSelectRole,
  onOpenMobileMenu,
  onOpenSopModal,
  onOpenRoadmapModal,
}) => {
  return (
    <header
      id="main-topbar"
      className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-2xs"
    >
      {/* Left: Brand & Product Classification */}
      <div className="flex items-center space-x-3 shrink-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div
          onClick={() => onSelectRole('home')}
          className="cursor-pointer flex items-center space-x-2.5 select-none"
        >
          <div className="w-7 h-7 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center tracking-tight">
            ST
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-slate-950 leading-tight">
              StockTrace
            </span>
            <span className="text-[11px] font-medium text-slate-500 leading-none">
              Inventory Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Center: Clean Enterprise Navigation (Subtle active state, no giant pills) */}
      <nav
        id="role-switcher-nav"
        className="hidden sm:flex items-center space-x-1"
        aria-label="Application Role Switcher"
      >
        <button
          id="role-btn-home"
          onClick={() => onSelectRole('home')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            currentRole === 'home'
              ? 'text-slate-950 bg-slate-100 font-bold'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Home
        </button>

        <button
          id="role-btn-picker"
          onClick={() => onSelectRole('picker')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            currentRole === 'picker'
              ? 'text-teal-900 bg-teal-50 font-bold border border-teal-200/60'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Picker
        </button>

        <button
          id="role-btn-supervisor"
          onClick={() => onSelectRole('supervisor')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            currentRole === 'supervisor'
              ? 'text-slate-950 bg-slate-100 font-bold'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Supervisor
        </button>

        <button
          id="role-btn-manager"
          onClick={() => onSelectRole('manager')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            currentRole === 'manager'
              ? 'text-slate-950 bg-slate-100 font-bold'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Manager
        </button>
      </nav>

      {/* Right: Environment & Governance Actions */}
      <div className="flex items-center space-x-3 shrink-0 text-xs">
        {/* Environment Tag */}
        <div className="hidden lg:flex items-center space-x-1.5 text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span className="font-medium text-slate-800">Bengaluru DC</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-normal">Demo Environment</span>
        </div>

        {/* Roadmap */}
        {onOpenRoadmapModal && (
          <button
            id="btn-open-roadmap"
            onClick={onOpenRoadmapModal}
            className="text-slate-600 hover:text-slate-950 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer hidden md:inline-flex items-center space-x-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Roadmap</span>
          </button>
        )}

        {/* SOP Guidance */}
        {onOpenSopModal && (
          <button
            id="btn-open-sop-guidance"
            onClick={onOpenSopModal}
            className="text-slate-700 hover:text-slate-950 font-medium bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center space-x-1.5"
            title="Warehouse Standard Operating Procedures (SOP)"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>SOP Guidance</span>
          </button>
        )}
      </div>
    </header>
  );
};

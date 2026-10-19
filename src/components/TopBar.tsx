import React, { useState } from 'react';
import {
  Menu,
  BookOpen,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  X,
  Home,
  MessageSquare,
  Users,
  BarChart3,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleRoleClick = (role: AppRole) => {
    onSelectRole(role);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        id="main-topbar"
        className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-2xs"
      >
        {/* Left: Brand & Product Classification */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            id="btn-toggle-mobile-menu"
            onClick={() => {
              if (currentRole === 'supervisor' && onOpenMobileMenu) {
                onOpenMobileMenu();
              } else {
                setMobileMenuOpen(!mobileMenuOpen);
              }
            }}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div
            onClick={() => handleRoleClick('home')}
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

        {/* Center: Clean Enterprise Navigation (Desktop) */}
        <nav
          id="role-switcher-nav"
          className="hidden sm:flex items-center space-x-1"
          aria-label="Application Role Switcher"
        >
          <button
            id="role-btn-home"
            onClick={() => handleRoleClick('home')}
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
            onClick={() => handleRoleClick('picker')}
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
            onClick={() => handleRoleClick('supervisor')}
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
            onClick={() => handleRoleClick('manager')}
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

      {/* Mobile Slide-down Role Navigation */}
      {mobileMenuOpen && (
        <div
          id="mobile-role-nav"
          className="sm:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2 z-20 shadow-md animate-in slide-in-from-top-2"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Switch Workflow Role
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              id="mobile-btn-home"
              onClick={() => handleRoleClick('home')}
              className={`p-2.5 rounded-lg border font-semibold flex items-center space-x-2 ${
                currentRole === 'home'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              id="mobile-btn-picker"
              onClick={() => handleRoleClick('picker')}
              className={`p-2.5 rounded-lg border font-semibold flex items-center space-x-2 ${
                currentRole === 'picker'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-emerald-50 text-emerald-950 border-emerald-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Picker</span>
            </button>

            <button
              id="mobile-btn-supervisor"
              onClick={() => handleRoleClick('supervisor')}
              className={`p-2.5 rounded-lg border font-semibold flex items-center space-x-2 ${
                currentRole === 'supervisor'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Supervisor</span>
            </button>

            <button
              id="mobile-btn-manager"
              onClick={() => handleRoleClick('manager')}
              className={`p-2.5 rounded-lg border font-semibold flex items-center space-x-2 ${
                currentRole === 'manager'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Manager</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            {onOpenRoadmapModal && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRoadmapModal();
                }}
                className="text-slate-600 hover:text-slate-900 font-medium py-1 px-2"
              >
                Roadmap
              </button>
            )}
            {onOpenSopModal && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSopModal();
                }}
                className="text-amber-700 font-semibold py-1 px-2 flex items-center space-x-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>SOP Guidance</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

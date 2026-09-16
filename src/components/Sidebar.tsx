import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  LayoutDashboard,
  Search,
  AlertTriangle,
  Database,
  X,
} from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  openCasesCount: number;
  completedCount: number;
  discrepanciesCount: number;
  connectedSystemsCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  openCasesCount,
  completedCount,
  discrepanciesCount,
  connectedSystemsCount = 3,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const handleNav = (tab: TabType) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 w-60 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 shrink-0 h-full overflow-y-auto transform transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header: StockTrace */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xs shrink-0 shadow-xs">
              ST
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight text-white leading-tight">
                StockTrace
              </h1>
              <p className="text-[11px] font-medium text-slate-400">
                Location Intelligence
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded text-slate-400 hover:text-white md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {/* PRIMARY NAVIGATION */}
          {/* Open Cases */}
          <button
            id="nav-tab-open-cases"
            onClick={() => handleNav('open-cases')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'open-cases'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 font-bold'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <AlertCircle
                className={`w-4 h-4 ${
                  currentTab === 'open-cases' ? 'text-slate-950' : 'text-rose-400'
                }`}
              />
              <span className="text-xs">Open Cases</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                currentTab === 'open-cases'
                  ? 'bg-slate-950 text-white'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {openCasesCount}
            </span>
          </button>

          {/* Completed Cases */}
          <button
            id="nav-tab-completed-cases"
            onClick={() => handleNav('completed-cases')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'completed-cases'
                ? 'bg-slate-800 text-white font-bold border-l-2 border-emerald-400 pl-2.5 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <CheckCircle2
                className={`w-4 h-4 ${
                  currentTab === 'completed-cases' ? 'text-emerald-400' : 'text-slate-400'
                }`}
              />
              <span>Completed Cases</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400">
              {completedCount}
            </span>
          </button>

          {/* Subtle Divider */}
          <div className="py-2">
            <div className="border-t border-slate-800" />
          </div>

          {/* SECONDARY NAVIGATION */}
          {/* Dashboard */}
          <button
            id="nav-tab-dashboard"
            onClick={() => handleNav('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-slate-800 text-white font-bold border-l-2 border-amber-400 pl-2.5 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <LayoutDashboard
                className={`w-4 h-4 ${
                  currentTab === 'dashboard' ? 'text-amber-400' : 'text-slate-400'
                }`}
              />
              <span>Dashboard</span>
            </div>
          </button>

          {/* Investigation Logs */}
          <button
            id="nav-tab-investigations"
            onClick={() => handleNav('investigations')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'investigations'
                ? 'bg-slate-800 text-white font-bold border-l-2 border-amber-400 pl-2.5 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Search
                className={`w-4 h-4 ${
                  currentTab === 'investigations' ? 'text-amber-400' : 'text-slate-400'
                }`}
              />
              <span>Investigation Logs</span>
            </div>
          </button>

          {/* Discrepancies */}
          <button
            id="nav-tab-discrepancies"
            onClick={() => handleNav('discrepancies')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'discrepancies'
                ? 'bg-slate-800 text-white font-bold border-l-2 border-amber-400 pl-2.5 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <AlertTriangle
                className={`w-4 h-4 ${
                  currentTab === 'discrepancies' ? 'text-amber-400' : 'text-slate-400'
                }`}
              />
              <span>Discrepancies</span>
            </div>
            {discrepanciesCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-300">
                {discrepanciesCount}
              </span>
            )}
          </button>

          {/* Connected Systems */}
          <button
            id="nav-tab-data-sources"
            onClick={() => handleNav('data-sources')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'data-sources'
                ? 'bg-slate-800 text-white font-bold border-l-2 border-amber-400 pl-2.5 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Database
                className={`w-4 h-4 ${
                  currentTab === 'data-sources' ? 'text-amber-400' : 'text-slate-400'
                }`}
              />
              <span>Connected Systems</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400">
              {connectedSystemsCount}
            </span>
          </button>
        </nav>

        {/* User Footer: Rajesh K. · Floor Lead · Online */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/50 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-700">
              RK
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-slate-200 font-bold truncate text-xs">Rajesh K.</div>
              <div className="text-[11px] text-slate-400">Floor Lead</div>
              <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-medium mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

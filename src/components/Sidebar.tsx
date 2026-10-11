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
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-2xs z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 w-56 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 h-full overflow-y-auto transform transition-transform duration-150 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
              ST
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-tight">
                Operations Console
              </div>
              <div className="text-[10px] text-slate-400">
                Bengaluru DC
              </div>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded text-slate-400 hover:text-white md:hidden cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 text-xs">
          {/* Open Cases */}
          <button
            id="nav-tab-open-cases"
            onClick={() => handleNav('open-cases')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md font-medium transition-colors cursor-pointer ${
              currentTab === 'open-cases'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Open Cases</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-rose-500/20 text-rose-300">
              {openCasesCount}
            </span>
          </button>

          {/* Completed Cases */}
          <button
            id="nav-tab-completed-cases"
            onClick={() => handleNav('completed-cases')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md font-medium transition-colors cursor-pointer ${
              currentTab === 'completed-cases'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Completed Cases</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono text-slate-400 bg-slate-800">
              {completedCount}
            </span>
          </button>

          <div className="py-2">
            <div className="border-t border-slate-800/80" />
          </div>

          {/* Investigation Logs */}
          <button
            id="nav-tab-investigations"
            onClick={() => handleNav('investigations')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md font-medium transition-colors cursor-pointer ${
              currentTab === 'investigations'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Investigation Logs</span>
            </div>
          </button>

          {/* Discrepancies */}
          <button
            id="nav-tab-discrepancies"
            onClick={() => handleNav('discrepancies')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md font-medium transition-colors cursor-pointer ${
              currentTab === 'discrepancies'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Discrepancies</span>
            </div>
            {discrepanciesCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-amber-500/20 text-amber-300">
                {discrepanciesCount}
              </span>
            )}
          </button>

          {/* Connected Systems */}
          <button
            id="nav-tab-data-sources"
            onClick={() => handleNav('data-sources')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md font-medium transition-colors cursor-pointer ${
              currentTab === 'data-sources'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Connected Systems</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono text-slate-400 bg-slate-800">
              {connectedSystemsCount}
            </span>
          </button>
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 font-bold flex items-center justify-center text-[10px] border border-slate-700">
              RK
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-slate-200 font-semibold text-xs truncate">Rajesh K.</div>
              <div className="text-[10px] text-slate-500">Warehouse Lead</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

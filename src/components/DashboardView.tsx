import React from 'react';
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Search,
  FileSpreadsheet,
} from 'lucide-react';
import { FailedPickCase } from '../types';

interface DashboardViewProps {
  cases: FailedPickCase[];
  onOpenCase: (c: FailedPickCase) => void;
  onGoToOpenCases: () => void;
  openCasesCount: number;
  resolvedCount: number;
  escalatedCount: number;
  avgResolutionTime: string;
  activeCase?: FailedPickCase | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cases,
  onOpenCase,
  onGoToOpenCases,
  openCasesCount,
  resolvedCount,
  escalatedCount,
  avgResolutionTime,
  activeCase,
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Overview of failed-pick resolution performance and warehouse discrepancies.
          </p>
        </div>

        <button
          onClick={onGoToOpenCases}
          className="self-start sm:self-auto py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-colors cursor-pointer shadow-xs"
        >
          <span>Open Cases ({openCasesCount})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards: 4 High-Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Failed picks resolved */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Failed Picks Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{resolvedCount}</span>
            <span className="text-xs text-emerald-700 font-bold">completed</span>
          </div>
          <p className="text-[11px] text-slate-400">Items found and verified</p>
        </div>

        {/* Faster resolution time */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Faster Resolution Time</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{avgResolutionTime}</span>
            <span className="text-xs text-indigo-700 font-semibold">avg</span>
          </div>
          <p className="text-[11px] text-slate-400">vs. 25 min manual search</p>
        </div>

        {/* Reduced search time */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Reduced Search Time</span>
            <Search className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">89%</span>
            <span className="text-xs text-amber-700 font-bold">reduction</span>
          </div>
          <p className="text-[11px] text-slate-400">Picker stays in productive picking</p>
        </div>

        {/* Discrepancies identified */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Discrepancies Identified</span>
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">18</span>
            <span className="text-xs text-slate-600 font-semibold">logged</span>
          </div>
          <p className="text-[11px] text-slate-400">Inventory locations corrected</p>
        </div>
      </div>

      {/* Summary table of recent activity */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Recent Case Summary
        </h2>
        <div className="divide-y divide-slate-100 text-xs">
          {cases.slice(0, 4).map((c) => (
            <div key={c.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-slate-900 mr-2">{c.sku}</span>
                <span className="text-slate-700 font-semibold">{c.item}</span>
                <span className="text-slate-400 ml-2 font-mono">Expected: {c.expectedLocation}</span>
              </div>
              <div>
                {c.status === 'RESOLVED' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    RESOLVED
                  </span>
                ) : c.status === 'ESCALATED' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                    ESCALATED
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                    OPEN
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Smartphone,
  Search,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AppRole, FailedPickCase } from '../../types';

interface HomeLandingViewProps {
  onSelectRole: (role: AppRole) => void;
  openCasesCount: number;
  completedCount: number;
  cases: FailedPickCase[];
}

export const HomeLandingView: React.FC<HomeLandingViewProps> = ({
  onSelectRole,
  openCasesCount,
  completedCount,
  cases,
}) => {
  const resolvedCount = cases.filter((c) => c.status === 'RESOLVED').length;
  const resolutionRate = cases.length > 0 ? Math.round((resolvedCount / cases.length) * 100) : 93;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* 1. Header / Positioning Section */}
      <div className="space-y-2 pt-2 border-b border-slate-200/80 pb-6">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
          <span>Warehouse Exception Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
          Find misplaced stock faster, without new hardware.
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Evidence-backed exception resolution using existing warehouse transaction and scanner data.
        </p>
      </div>

      {/* 2. Choose Your Workflow — Three Persona Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Choose your workflow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CARD 1: PICKER */}
          <div
            id="role-card-picker"
            onClick={() => onSelectRole('picker')}
            className="group bg-white rounded-xl border border-slate-200 hover:border-teal-600 p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                  Picker
                </span>
                <Smartphone className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  &ldquo;Tell me where to look.&rdquo;
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Simple mobile-first experience. Voice-first guidance with zero typing and single clear instructions.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-medium text-slate-600">
                <span className="bg-slate-100 px-2 py-0.5 rounded">Voice-first</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">Mobile</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">Simple actions</span>
              </div>
            </div>

            <button className="w-full py-2 px-3 bg-slate-900 group-hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer">
              <span>Open Picker</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* CARD 2: SUPERVISOR */}
          <div
            id="role-card-supervisor"
            onClick={() => onSelectRole('supervisor')}
            className="group bg-white rounded-xl border border-slate-200 hover:border-slate-800 p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  Supervisor
                </span>
                <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                  &ldquo;Show me the evidence.&rdquo;
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Investigate failed picks, review transaction & scanner movement evidence, and audit verifications.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-medium text-slate-600">
                <span className="bg-slate-100 px-2 py-0.5 rounded">Investigation</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">Evidence</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">Audit trail</span>
              </div>
            </div>

            <button className="w-full py-2 px-3 bg-slate-900 group-hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer">
              <span>Open Supervisor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* CARD 3: MANAGER */}
          <div
            id="role-card-manager"
            onClick={() => onSelectRole('manager')}
            className="group bg-white rounded-xl border border-slate-200 hover:border-slate-800 p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  Manager
                </span>
                <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                  &ldquo;Show me the value.&rdquo;
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Understand operational impact, recovered order value, and explore editable ROI assumptions.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-medium text-slate-600">
                <span className="bg-slate-100 px-2 py-0.5 rounded">ROI</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">Operations</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">Decision support</span>
              </div>
            </div>

            <button className="w-full py-2 px-3 bg-slate-900 group-hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer">
              <span>Open Manager</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL SNAPSHOT — 4 Clean Enterprise KPI Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Operational Snapshot
          </h2>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            DEMO DATA
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
            <div className="text-xs font-medium text-slate-500">Failed Picks Today</div>
            <div className="text-2xl font-bold font-mono text-slate-950 mt-1">45</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across active aisles</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
            <div className="text-xs font-medium text-slate-500">Resolution Rate</div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{resolutionRate}%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Physical confirmations</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
            <div className="text-xs font-medium text-slate-500">Scanner-Based Resolution</div>
            <div className="text-2xl font-bold font-mono text-slate-950 mt-1">84%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Via transaction & scan logs</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
            <div className="text-xs font-medium text-slate-500">Median Resolution Time</div>
            <div className="text-2xl font-bold font-mono text-slate-950 mt-1">02:41</div>
            <div className="text-[11px] text-slate-400 mt-0.5">vs. 18 min manual search</div>
          </div>
        </div>
      </div>



      {/* 5. Footer / Trust Principle Information */}
      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="font-semibold text-slate-700">
          Trust Principle: &ldquo;StockTrace recommends. Humans verify.&rdquo;
        </div>
        <div className="text-slate-400 text-[11px]">
          Bengaluru DC • Demo Environment • All figures labeled as illustrative assumptions
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { FailedPickCase } from '../types';

interface OpenCasesViewProps {
  cases: FailedPickCase[];
  onOpenCase: (c: FailedPickCase) => void;
  onViewCompleted?: () => void;
  completedCount?: number;
}

export const OpenCasesView: React.FC<OpenCasesViewProps> = ({
  cases,
  onOpenCase,
  onViewCompleted,
  completedCount = 0,
}) => {
  const openCases = cases.filter(
    (c) => c.status !== 'RESOLVED' && c.status !== 'ESCALATED'
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          OPEN CASES
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Items reported missing during warehouse picking.
        </p>
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {openCases.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 text-center space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">All Open Cases Resolved</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              There are no pending failed-pick exceptions. When an item is reported missing during warehouse picking, it will appear here.
            </p>
            {onViewCompleted && completedCount > 0 && (
              <button
                onClick={onViewCompleted}
                className="mt-2 inline-flex items-center space-x-1 text-xs font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
              >
                <span>View Completed Cases ({completedCount}) &rarr;</span>
              </button>
            )}
          </div>
        ) : (
          openCases.map((c) => (
            <div
              key={c.id}
              id={`case-card-${c.sku.toLowerCase()}`}
              onClick={() => onOpenCase(c)}
              className="group bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-5 transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Item Details */}
                <div className="space-y-1">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      ITEM NOT FOUND
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                    {c.item}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 pt-0.5">
                    <span className="font-mono font-bold text-slate-800">
                      {c.sku}
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span>Qty {c.qty}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span>
                      Expected <strong className="font-mono text-slate-900">{c.expectedLocation}</strong>
                    </span>
                  </div>
                </div>

                {/* Right: Open Case Action */}
                <div className="shrink-0">
                  <button
                    id={`btn-open-case-${c.sku.toLowerCase()}`}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 bg-slate-900 group-hover:bg-amber-500 text-white group-hover:text-slate-950 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>OPEN CASE</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

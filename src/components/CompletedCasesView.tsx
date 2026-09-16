import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { FailedPickCase } from '../types';

interface CompletedCasesViewProps {
  cases: FailedPickCase[];
  onBackToOpenCases?: () => void;
}

export const CompletedCasesView: React.FC<CompletedCasesViewProps> = ({
  cases,
  onBackToOpenCases,
}) => {
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  const completedCases = cases.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'ESCALATED'
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            COMPLETED CASES
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            History of resolved and escalated warehouse exceptions.
          </p>
        </div>

        {onBackToOpenCases && (
          <button
            onClick={onBackToOpenCases}
            className="self-start sm:self-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            &larr; Open Cases
          </button>
        )}
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {completedCases.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 text-center space-y-3 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">No Completed Cases</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Resolved or escalated pick cases will appear here.
            </p>
          </div>
        ) : (
          completedCases.map((c) => {
            const isResolved = c.status === 'RESOLVED';
            const isExpanded = expandedCaseId === c.id;

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    {/* Badge */}
                    <div>
                      {isResolved ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>RESOLVED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>ESCALATED</span>
                        </span>
                      )}
                    </div>

                    {/* Item */}
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      {c.item}
                    </h2>

                    {/* SKU */}
                    <div className="font-mono text-xs font-bold text-slate-700">
                      {c.sku}
                    </div>

                    {/* Expected & Found */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 pt-1">
                      <span>
                        Expected: <strong className="font-mono text-slate-800">{c.expectedLocation}</strong>
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      {isResolved ? (
                        <span>
                          Found: <strong className="font-mono text-emerald-700 font-bold">{c.foundLocation || 'B07'}</strong>
                        </span>
                      ) : (
                        <span className="text-rose-700 font-medium">
                          Not found after investigation
                        </span>
                      )}
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-slate-500 font-medium">
                        {isResolved ? 'Completed' : 'Sent for Review'}
                      </span>
                    </div>
                  </div>

                  {/* Expand / Collapse for detail audit if supervisor wants */}
                  <button
                    onClick={() => setExpandedCaseId(isExpanded ? null : c.id)}
                    className="self-start text-xs text-slate-500 hover:text-slate-900 flex items-center space-x-1 py-1 px-2 rounded hover:bg-slate-50 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Optional Detailed Record View */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Case ID:</span>
                      <span className="font-mono font-bold text-slate-900">{c.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Quantity:</span>
                      <span className="font-bold text-slate-900">{c.qty} units</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Resolution Time:</span>
                      <span className="font-mono text-slate-900">{c.resolutionTime || '02:41'}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

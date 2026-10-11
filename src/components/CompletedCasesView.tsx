import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Layers, Check, ArrowLeft } from 'lucide-react';
import { FailedPickCase } from '../types';

interface CompletedCasesViewProps {
  cases: FailedPickCase[];
  onBackToOpenCases?: () => void;
  onReopenCase?: (c: FailedPickCase) => void;
}

export const CompletedCasesView: React.FC<CompletedCasesViewProps> = ({
  cases,
  onBackToOpenCases,
  onReopenCase,
}) => {
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  const completedCases = cases.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'ESCALATED'
  );

  return (
    <div className="space-y-5 max-w-5xl mx-auto w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
            Completed Exceptions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical audit log of resolved and escalated warehouse inventory exceptions.
          </p>
        </div>

        {onBackToOpenCases && (
          <button
            onClick={onBackToOpenCases}
            className="self-start sm:self-auto px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Open Exceptions</span>
          </button>
        )}
      </div>

      {/* Cases List */}
      <div className="space-y-2.5">
        {completedCases.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center space-y-2 shadow-2xs">
            <h3 className="text-sm font-semibold text-slate-900">No Completed Cases Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Resolved or escalated pick cases will appear here with verification audit records.
            </p>
          </div>
        ) : (
          completedCases.map((c) => {
            const isResolved = c.status === 'RESOLVED';
            const isExpanded = expandedCaseId === c.id;

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    {/* Status Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isResolved ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>RESOLVED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>ESCALATED</span>
                        </span>
                      )}

                      {/* Evidence Badge */}
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        <Layers className="w-3 h-3 text-slate-500" />
                        <span>{c.evidenceTierUsed === 'TIER_3_CONDITIONAL_AI' ? 'Tier 3 (AI Video)' : c.evidenceTierUsed === 'TIER_2_TARGETED_CAMERA' ? 'Tier 2 (Targeted Camera)' : c.evidenceTierUsed === 'INSUFFICIENT' ? 'Insufficient Evidence' : 'Tier 1 (Scanner & WMS)'}</span>
                      </span>

                      {/* Picker Response */}
                      {c.pickerOutcome && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/60">
                          <span>Picker: {c.pickerOutcome}</span>
                        </span>
                      )}
                    </div>

                    {/* Item */}
                    <div className="text-base font-bold text-slate-900">
                      {c.item}
                    </div>

                    {/* SKU & Locations */}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
                      <span className="font-mono font-bold text-slate-900">{c.sku}</span>
                      <span className="text-slate-300">&bull;</span>
                      <span>Expected: <strong className="font-mono text-slate-800">{c.expectedLocation}</strong></span>
                      <span className="text-slate-300">&bull;</span>
                      {isResolved ? (
                        <span>Verified at: <strong className="font-mono text-emerald-700 font-bold">{c.foundLocation || 'B07'}</strong></span>
                      ) : (
                        <span className="text-rose-700">Escalated to Supervisor</span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Expand */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {onReopenCase && (
                      <button
                        onClick={() => onReopenCase(c)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
                        title="Reopen and test this case again"
                      >
                        Re-open
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedCaseId(isExpanded ? null : c.id)}
                      className="text-xs text-slate-500 hover:text-slate-900 flex items-center space-x-1 py-1 px-2 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide' : 'Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Detailed Record View */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-md text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Case ID:</span>
                      <span className="font-mono font-bold text-slate-900">{c.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Quantity:</span>
                      <span className="font-semibold text-slate-900">{c.qty} units</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Resolution Time:</span>
                      <span className="font-mono text-slate-900">{c.resolutionTime || '02:41'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Evidence Record:</span>
                      <span className="font-medium text-slate-900">
                        {c.tierResolutionNote || 'Scanner put-away & movement transaction'}
                      </span>
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

import React, { useState, useMemo } from 'react';
import { ArrowRight, CheckCircle2, Search, Filter, AlertTriangle, ShieldCheck, Layers, Clock, AlertCircle } from 'lucide-react';
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
  const [skuFilter, setSkuFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Search
      if (skuFilter) {
        const query = skuFilter.toLowerCase();
        const matchesSku = c.sku.toLowerCase().includes(query);
        const matchesItem = c.item.toLowerCase().includes(query);
        const matchesId = c.id.toLowerCase().includes(query);
        const matchesLoc = c.expectedLocation.toLowerCase().includes(query) || (c.recommendedLocation && c.recommendedLocation.toLowerCase().includes(query));
        if (!matchesSku && !matchesItem && !matchesId && !matchesLoc) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'open') {
        if (c.status === 'RESOLVED' || c.status === 'ESCALATED') return false;
      } else if (statusFilter !== 'all') {
        if (c.status !== statusFilter) return false;
      }

      // Tier filter
      if (tierFilter !== 'all') {
        if (tierFilter === 'tier-1') {
          if (c.evidenceTierUsed !== 'TIER_1_SCANNER_WMS' && c.evidenceTierUsed !== 'TRANSACTION_SCANNER') return false;
        } else if (tierFilter === 'tier-2') {
          if (c.evidenceTierUsed !== 'TIER_2_TARGETED_CAMERA') return false;
        } else if (tierFilter === 'tier-3') {
          if (c.evidenceTierUsed !== 'TIER_3_CONDITIONAL_AI') return false;
        } else if (tierFilter === 'insufficient') {
          if (c.evidenceTierUsed !== 'INSUFFICIENT' && c.evidenceTierUsed !== 'CONFLICTING' && c.evidenceTierUsed !== 'STALE') return false;
        }
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        if (c.priority !== priorityFilter) return false;
      }

      return true;
    });
  }, [cases, skuFilter, statusFilter, tierFilter, priorityFilter]);

  const openCasesCount = cases.filter(
    (c) => c.status !== 'RESOLVED' && c.status !== 'ESCALATED'
  ).length;

  return (
    <div className="space-y-5 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
            Supervisor Operational Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review failed picks, evaluate 3-tier evidence, and audit human verifications across warehouse zones.
          </p>
        </div>

        {onViewCompleted && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onViewCompleted}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-2xs transition-colors cursor-pointer self-start sm:self-auto flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Completed Cases ({completedCount})</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Filters: Status, Evidence Tier, Priority, Search */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* SKU / Item search */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={skuFilter}
              onChange={(e) => setSkuFilter(e.target.value)}
              placeholder="Search Case ID, SKU, Item, Bay..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="open">Status: Open Exceptions ({openCasesCount})</option>
            <option value="all">Status: All Records ({cases.length})</option>
            <option value="ITEM_NOT_FOUND">Item Not Found</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="TRY_LOCATION">Recommendation Ready</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED">Escalated</option>
          </select>

          {/* Evidence Tier filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">Tier: All Evidence Tiers</option>
            <option value="tier-1">Tier 1: Transaction &amp; Scanner</option>
            <option value="tier-2">Tier 2: Targeted Camera</option>
            <option value="tier-3">Tier 3: Conditional AI Video</option>
            <option value="insufficient">Insufficient / Conflicting / Stale</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">Priority: All</option>
            <option value="HIGH">High Priority</option>
            <option value="NORMAL">Normal Priority</option>
          </select>
        </div>

        <div className="text-slate-500 text-[11px] font-mono shrink-0">
          Showing <strong>{filteredCases.length}</strong> of {cases.length} cases
        </div>
      </div>

      {/* Main Case Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        {filteredCases.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Exceptions Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No inventory exceptions match the current filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3.5">Case ID</th>
                  <th className="py-2.5 px-3.5">SKU &amp; Item</th>
                  <th className="py-2.5 px-3.5">Expected</th>
                  <th className="py-2.5 px-3.5">Suggested Location</th>
                  <th className="py-2.5 px-3.5">Evidence Tier</th>
                  <th className="py-2.5 px-3.5">Picker Response</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCases.map((c) => {
                  const recLoc = c.recommendedLocation || '—';
                  const isPickerFound = c.pickerOutcome === 'FOUND';
                  const isHighPriority = c.priority === 'HIGH';

                  return (
                    <tr
                      key={c.id}
                      id={`case-row-${c.sku.toLowerCase()}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Case ID & Timestamps */}
                      <td className="py-3 px-3.5 font-mono text-[11px]">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{c.id}</span>
                          {isHighPriority && (
                            <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1 rounded uppercase">
                              High
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[10px] flex items-center space-x-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{c.reportedAt || '14:34'}</span>
                        </div>
                      </td>

                      {/* SKU & Item */}
                      <td className="py-3 px-3.5">
                        <div className="font-mono font-bold text-slate-950">{c.sku}</div>
                        <div className="font-medium text-slate-800 truncate max-w-[180px]">{c.item}</div>
                        <div className="text-[11px] text-slate-400">
                          Qty: {c.qty} &bull; {c.orderNumber || 'ORD-88201'}
                        </div>
                      </td>

                      {/* Expected Location */}
                      <td className="py-3 px-3.5 font-mono text-slate-700 font-bold">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {c.expectedLocation}
                        </span>
                      </td>

                      {/* Suggested Location */}
                      <td className="py-3 px-3.5 font-mono">
                        {recLoc !== '—' && c.evidenceTierUsed !== 'INSUFFICIENT' && c.evidenceTierUsed !== 'CONFLICTING' ? (
                          <span className="bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200/80">
                            {recLoc}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            {c.evidenceTierUsed === 'CONFLICTING' ? 'Conflict' : 'No suggestion'}
                          </span>
                        )}
                      </td>

                      {/* Evidence Tier */}
                      <td className="py-3 px-3.5">
                        {c.evidenceTierUsed === 'TIER_3_CONDITIONAL_AI' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                            <span>Tier 3 (AI Video)</span>
                          </span>
                        ) : c.evidenceTierUsed === 'TIER_2_TARGETED_CAMERA' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            <span>Tier 2 (Camera)</span>
                          </span>
                        ) : c.evidenceTierUsed === 'CONFLICTING' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Conflicting</span>
                          </span>
                        ) : c.evidenceTierUsed === 'STALE' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
                            <span>Stale (&gt;2h)</span>
                          </span>
                        ) : c.evidenceTierUsed === 'INSUFFICIENT' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <span>Insufficient</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/60">
                            <span>Tier 1 (Scanner)</span>
                          </span>
                        )}
                      </td>

                      {/* Picker Response */}
                      <td className="py-3 px-3.5">
                        {c.pickerOutcome ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                              isPickerFound
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : c.pickerOutcome === 'PARTIALLY_FOUND'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : c.pickerOutcome === 'DAMAGED'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {c.pickerOutcome}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Awaiting check</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            c.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : c.status === 'ESCALATED'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3.5 text-right">
                        <button
                          id={`btn-open-case-${c.sku.toLowerCase()}`}
                          onClick={() => onOpenCase(c)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <span>Investigate</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

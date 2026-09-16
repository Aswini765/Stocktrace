import React, { useState } from 'react';
import { Search, MapPin, Eye, Clock, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { InvestigationRecord } from '../types';
import { EvidenceModal } from './EvidenceModal';

interface InvestigationsViewProps {
  investigations: InvestigationRecord[];
}

export const InvestigationsView: React.FC<InvestigationsViewProps> = ({ investigations }) => {
  const [selectedRecord, setSelectedRecord] = useState<InvestigationRecord | null>(null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            INVESTIGATION LOGS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Logs of failed-pick traces and recommended locations.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          {investigations.length} logged
        </div>
      </div>

      {/* Investigation Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Case</th>
                <th className="p-4">Item</th>
                <th className="p-4">Expected Location</th>
                <th className="p-4">Result / Recommendation</th>
                <th className="p-4">Status</th>
                <th className="p-4">Time</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {investigations.map((inv) => (
                <tr
                  key={inv.id}
                  id={`inv-row-${inv.id.toLowerCase()}`}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedRecord(inv)}
                >
                  <td className="p-4 font-mono font-bold text-slate-900">{inv.id}</td>

                  <td className="p-4">
                    <span className="font-bold text-slate-900 block">{inv.sku}</span>
                  </td>

                  <td className="p-4 font-mono">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                      {inv.expectedLocation}
                    </span>
                  </td>

                  <td className="p-4 font-mono">
                    {inv.recommendedLocation !== '—' ? (
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {inv.recommendedLocation}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-bold">—</span>
                    )}
                  </td>

                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        inv.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>

                  <td className="p-4 font-mono text-slate-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{inv.resolutionTime}</span>
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecord(inv);
                      }}
                      className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-900 font-semibold text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <EvidenceModal
          isOpen={true}
          onClose={() => setSelectedRecord(null)}
          sku={selectedRecord.sku}
          expectedLocation={selectedRecord.expectedLocation}
          recommendedLocation={selectedRecord.recommendedLocation}
          scenario={
            selectedRecord.status === 'Resolved'
              ? 'happy-path'
              : selectedRecord.evidence.includes('Insufficient')
              ? 'no-camera'
              : 'conflict'
          }
        />
      )}
    </div>
  );
};

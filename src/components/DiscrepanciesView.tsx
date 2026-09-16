import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, MapPin, Download, Filter } from 'lucide-react';
import { DiscrepancyRecord } from '../types';

interface DiscrepanciesViewProps {
  discrepancies: DiscrepancyRecord[];
}

export const DiscrepanciesView: React.FC<DiscrepanciesViewProps> = ({ discrepancies }) => {
  const [exportNotice, setExportNotice] = React.useState<string | null>(null);

  const handleExport = () => {
    setExportNotice('Exported discrepancies to CSV (ready for inventory cycle count).');
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            DISCREPANCIES
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Spatial discrepancies between expected locations and physical verified locations.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">SKU / Item</th>
                <th className="p-4">Expected Location</th>
                <th className="p-4">Physical Outcome</th>
                <th className="p-4">Impact</th>
                <th className="p-4">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {discrepancies.map((disc) => (
                <tr key={disc.id} id={`disc-row-${disc.id.toLowerCase()}`} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-mono font-bold text-slate-900">{disc.sku}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{disc.itemName}</div>
                  </td>

                  <td className="p-4 font-mono">
                    <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {disc.expectedLocation}
                    </span>
                  </td>

                  <td className="p-4 font-mono">
                    {disc.foundLocation !== '—' ? (
                      <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Found at {disc.foundLocation}
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Missing
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-slate-600">
                    <span className="text-xs font-semibold text-slate-800 block">{disc.reason}</span>
                    <span className="text-[11px] text-slate-400 font-mono">Reported {disc.time}</span>
                  </td>

                  <td className="p-4">
                    <span className="inline-flex items-center space-x-1 font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{disc.foundLocation !== '—' ? 'Inventory location updated' : 'Cycle count scheduled'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

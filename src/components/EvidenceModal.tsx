import React from 'react';
import {
  X,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Scan,
  MapPin,
  Server,
  AlertTriangle,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sku?: string;
  expectedLocation?: string;
  recommendedLocation?: string;
  scenario?: 'happy-path' | 'no-camera' | 'conflict';
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  sku = 'SKU-1042',
  expectedLocation = 'A12',
  recommendedLocation = 'B07',
  scenario = 'happy-path',
}) => {
  if (!isOpen) return null;

  const isInsufficient = scenario === 'no-camera';
  const isConflict = scenario === 'conflict';
  const isResolved = scenario === 'happy-path';

  return (
    <div
      id="evidence-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                AUDIT LOG
              </span>
              <span className="text-sm font-bold text-slate-900">
                Exception Investigation Detail
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Evidence-backed resolution using warehouse transaction and scanner movement data.
            </p>
          </div>
          <button
            id="btn-close-evidence-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Target SKU Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] font-medium block">Item SKU</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{sku}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] font-medium block">Expected Location</span>
              <span className="font-bold text-slate-900 text-sm flex items-center space-x-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{expectedLocation}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] font-medium block">Recommended Location</span>
              <span className="font-bold text-sm font-mono">
                {isInsufficient ? (
                  <span className="text-slate-400">—</span>
                ) : (
                  <span className="text-emerald-700">{recommendedLocation}</span>
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] font-medium block">Status</span>
              <span
                className={`font-bold text-xs inline-block px-2 py-0.5 rounded mt-0.5 ${
                  isResolved
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : isInsufficient
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {isResolved ? 'Resolved' : isInsufficient ? 'Escalated' : 'Conflicting'}
              </span>
            </div>
          </div>

          {/* Section 12: Insufficient Evidence Alert */}
          {isInsufficient && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                <span>NO RELIABLE LOCATION FOUND</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                StockTrace does not have enough evidence to recommend a location.
                No uncommitted scanner put-aways or tote movements were detected for this SKU.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-200/60 text-amber-950 border border-amber-300">
                  ESCALATE TO SUPERVISOR
                </span>
              </div>
            </div>
          )}

          {/* Section 1: Warehouse Transaction Evidence */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Server className="w-4 h-4 text-slate-600" />
              <span>1. Warehouse Transaction Records</span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-slate-50/30">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Transaction</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Terminal ID</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="bg-white">
                    <td className="p-3 font-mono text-slate-600">09:30 AM</td>
                    <td className="p-3 font-medium">Put-away Receipt (12 units)</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{expectedLocation}</td>
                    <td className="p-3 font-mono text-slate-500">ST-SCAN-04</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        Committed
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="p-3 font-mono text-slate-600">09:41 AM</td>
                    <td className="p-3 font-medium text-rose-700 font-semibold">Pick Failed (SKU absent)</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{expectedLocation}</td>
                    <td className="p-3 font-mono text-slate-500">MOB-PICK-09</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                        Exception
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Handheld Scanner Movement Evidence */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Scan className="w-4 h-4 text-slate-600" />
              <span>2. Handheld Scanner Movement Stream</span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-slate-50/30">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">Origin</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Inference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isInsufficient ? (
                    <tr className="bg-white">
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                        No movement signals recorded for this item within the last 60 minutes.
                      </td>
                    </tr>
                  ) : (
                    <>
                      <tr className="bg-white">
                        <td className="p-3 font-mono text-slate-600">09:42 AM</td>
                        <td className="p-3 font-medium">Batch Transfer Scan</td>
                        <td className="p-3 font-mono">{expectedLocation}</td>
                        <td className="p-3 font-mono">Aisle 3</td>
                        <td className="p-3 text-slate-600">Displaced from expected bay</td>
                      </tr>
                      <tr className="bg-emerald-50/40">
                        <td className="p-3 font-mono text-slate-600">09:42 AM</td>
                        <td className="p-3 font-medium">Adjacent Bin Put-down</td>
                        <td className="p-3 font-mono">Aisle 3</td>
                        <td className="p-3 font-mono font-bold text-emerald-800">{recommendedLocation}</td>
                        <td className="p-3 font-bold text-emerald-700">High confidence destination</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Physical Verification Audit Trail */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-slate-600" />
              <span>3. Human Physical Verification</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Core Principle:</span>
                <span className="text-[11px] font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  StockTrace recommends. Humans verify.
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[12px]">
                {isResolved ? (
                  <>
                    Picker checked recommended location <strong className="text-slate-900">{recommendedLocation}</strong> and physically confirmed <strong className="text-emerald-700">FOUND</strong> at 09:44 AM.
                    Physical verification confirmed. WMS location ledger updated.
                  </>
                ) : isInsufficient ? (
                  <>
                    No location recommendation generated. Case escalated to supervisor for physical cycle count.
                  </>
                ) : (
                  <>
                    Item discrepancy logged. Pending manual floor verification across adjacent bays.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono">
            {sku} · Case Detail Log
          </span>
          <button
            id="btn-close-evidence-bottom"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};

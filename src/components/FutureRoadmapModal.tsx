import React from 'react';
import { X, ShieldCheck, Map, AlertTriangle, Lock, EyeOff, Bot, Server } from 'lucide-react';

interface FutureRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FutureRoadmapModal: React.FC<FutureRoadmapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-black text-sm tracking-tight text-white">
                Privacy Guardrails & Future Roadmap (V2 Specification)
              </h2>
              <p className="text-[11px] text-slate-400">
                Clear boundaries between V2 prototype scope and future production roadmap
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Section 1: Privacy and Trust Rules */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>1. Privacy and Worker Trust Principles</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-950 block">Transaction & Scanner Only</span>
                <p className="text-[11px] text-emerald-800 leading-snug">
                  StockTrace relies exclusively on warehouse transactions and handheld scanner events. No cameras or new hardware.
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-950 block">Supervisor-Restricted Audit</span>
                <p className="text-[11px] text-emerald-800 leading-snug">
                  Pickers receive only location instructions; full system logs and movement timelines are restricted to supervisors.
                </p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
                <span className="font-bold text-rose-950 block">No Worker Tracking</span>
                <p className="text-[11px] text-rose-800 leading-snug">
                  StockTrace strictly tracks item and tote movements, never worker identity, speed rankings, or personal surveillance.
                </p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
                <span className="font-bold text-rose-950 block">No Optical Hardware</span>
                <p className="text-[11px] text-rose-800 leading-snug">
                  Zero optical sensors or CCTV integration. Operates 100% on existing warehouse scanner and ERP event records.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Out of Scope for V2 (What MUST NOT be built) */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <EyeOff className="w-4 h-4 text-rose-600" />
              <span>2. Explicit Out-of-Scope Boundaries (Current V2 Prototype)</span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <p className="text-[11px] text-slate-600">
                To maintain prototype focus and validate core hypotheses without unnecessary capital expenditure, the following are explicitly out of scope for V2:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 font-medium">
                <li>Production WhatsApp Business Cloud API integration (simulated via responsive UI)</li>
                <li>Live ERP/WMS write-back connectors (no automated inventory ledger balance adjustments)</li>
                <li>Autonomous warehouse robotics actions</li>
                <li>BLE / RFID gateway hardware installation</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Future Roadmap */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Map className="w-4 h-4 text-indigo-600" />
              <span>3. Future Post-Pilot Roadmap</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                <div className="font-bold text-indigo-950">Phase 3: Production WhatsApp Business API</div>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Native webhook integration with warehouse WhatsApp Enterprise numbers for 2-way audio voice notes.
                </p>
              </div>
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                <div className="font-bold text-indigo-950">Phase 4: Two-Way WMS/ERP Connectors</div>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Certified connectors for SAP EWM, Manhattan Associates, Blue Yonder, and Vinculum.
                </p>
              </div>
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                <div className="font-bold text-indigo-950">Phase 5: Inventory Risk Radar</div>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Predictive heatmaps identifying bays and aisles with recurring misplacement risks before pick orders fail.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

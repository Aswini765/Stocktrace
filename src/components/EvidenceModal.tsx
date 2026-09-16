import React from 'react';
import { X, CheckCircle2, ShieldAlert, Clock, Scan, Camera, ArrowRight, MapPin } from 'lucide-react';
import { CameraFrameGraphic } from './CameraFrameGraphic';
import { CameraPathTimeline } from './CameraPathTimeline';

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
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                HERE'S WHAT WE FOUND
              </span>
              <span className="text-sm font-semibold text-slate-800">
                What StockTrace Checked
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Checked recent activity, scanner history, and nearby camera footage.
            </p>
          </div>
          <button
            id="btn-close-evidence-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Target SKU Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100/80 p-3.5 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">Item SKU</span>
              <span className="font-bold text-slate-900 text-sm">{sku}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Expected Location</span>
              <span className="font-bold text-slate-900 text-sm flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{expectedLocation}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Recommendation</span>
              <span className="font-bold text-emerald-700 text-sm">
                {scenario === 'happy-path' ? `Try ${recommendedLocation} next` : 'Escalate for warehouse review'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Status</span>
              <span className={`font-bold text-xs inline-block px-2 py-0.5 rounded ${
                scenario === 'happy-path'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {scenario === 'happy-path' ? 'Information matches' : 'Insufficient information'}
              </span>
            </div>
          </div>

          {/* Section 1: Visual Camera Frames & Events (Primary Evidence) */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Camera className="w-4 h-4 text-slate-600" />
              <span>1. Observed Camera Movement Trail</span>
            </div>

            <CameraPathTimeline currentStepIndex={3} scenario={scenario} />

            {scenario === 'no-camera' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-950 mb-1">No Useful Camera Footage</div>
                  <p>
                    Cameras near Bay A12 did not record clear movement between 2:32 PM and 2:38 PM.
                    No reliable information is available to suggest another location.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <CameraFrameGraphic
                    type="a12"
                    cameraName="A12-CAM"
                    timestamp="2:34 PM"
                    eventNote="Movement seen leaving A12"
                  />
                  <div className="text-[11px] text-slate-600 mt-1.5 font-medium">
                    <span className="font-bold text-slate-900">2:34 PM</span> — Movement was seen leaving A12.
                  </div>
                </div>

                <div>
                  <CameraFrameGraphic
                    type="aisle3"
                    cameraName="AISLE-3-CAM"
                    timestamp="2:35 PM"
                    eventNote="Heading toward B07"
                  />
                  <div className="text-[11px] text-slate-600 mt-1.5 font-medium">
                    <span className="font-bold text-slate-900">2:35 PM</span> — Movement appears to be heading toward B07.
                  </div>
                </div>

                <div>
                  <CameraFrameGraphic
                    type={scenario === 'conflict' ? 'empty' : 'b07'}
                    cameraName={scenario === 'conflict' ? 'C03-CAM' : 'B07-CAM'}
                    timestamp="2:36 PM"
                    eventNote={scenario === 'conflict' ? 'Activity near C03' : 'Activity near B07'}
                  />
                  <div className="text-[11px] text-slate-600 mt-1.5 font-medium">
                    <span className="font-bold text-slate-900">2:36 PM</span> —{' '}
                    {scenario === 'conflict'
                      ? 'Camera shows activity near C03.'
                      : 'Activity seen near B07.'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Simple Camera Story */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
            <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Camera Movement Summary
            </div>
            <p className="text-slate-600 leading-relaxed">
              • Movement was seen leaving A12 at 2:34 PM.<br />
              • Movement appears to be heading toward B07 at 2:35 PM.<br />
              • Activity was seen near B07 at 2:36 PM.<br />
              Camera footage suggests the item moved toward B07.
            </p>
          </div>

          {/* Section 3: Background System Record (Internal reference) */}
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              <Scan className="w-4 h-4 text-slate-500" />
              <span>3. Internal System Log (Put-away Record)</span>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs bg-slate-50/50">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5">Activity</th>
                    <th className="p-2.5">Location</th>
                    <th className="p-2.5">Device</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  <tr className="bg-white">
                    <td className="p-2.5 font-mono">2:32 PM</td>
                    <td className="p-2.5 font-medium">Put-away (5 units)</td>
                    <td className="p-2.5 font-bold text-slate-900">{expectedLocation}</td>
                    <td className="p-2.5 text-slate-500">Scanner 07</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        Last put-away
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Task: SKU-1042 | Wireless Adapter
          </span>
          <button
            id="btn-close-evidence-bottom"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

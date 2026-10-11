import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Package,
  Layers,
  Clock,
  ShieldCheck,
  Check,
  X,
  FileText,
  Video,
  Cpu,
  Scan,
  AlertCircle,
  History,
  Send,
  Eye,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { FailedPickCase, ScenarioType, WorkerVerificationOutcome, EvidenceTier } from '../types';
import { SCANNER_TRANSACTIONS } from '../data/mockData';

interface CaseResolutionFlowProps {
  caseData: FailedPickCase;
  scenario?: ScenarioType;
  onCompleteResolution: (details: {
    sku: string;
    itemName: string;
    expectedLocation: string;
    verifiedLocation: string;
    resolutionTime: string;
    evidence: string;
    status: 'Resolved' | 'Escalated';
    outcome?: WorkerVerificationOutcome;
    foundQuantity?: number;
    discrepancyReason?: string;
  }) => void;
  onBackToOpenCases: () => void;
  onResetCase?: () => void;
  onRequestRecheck?: (caseId: string) => void;
}

export const CaseResolutionFlow: React.FC<CaseResolutionFlowProps> = ({
  caseData,
  onCompleteResolution,
  onBackToOpenCases,
  onResetCase,
  onRequestRecheck,
}) => {
  // Active Evidence Tier Tab: Tier 1 (Scanner), Tier 2 (Camera), Tier 3 (AI Video)
  const [activeTierTab, setActiveTierTab] = useState<'tier-1' | 'tier-2' | 'tier-3'>('tier-1');

  // Tier 3 Prototype AI execution state
  const [isAiRunning, setIsAiRunning] = useState<boolean>(false);
  const [tier3Completed, setTier3Completed] = useState<boolean>(
    caseData.tier3AiAnalysis?.status === 'COMPLETED'
  );

  // Sub-actions and dialogs
  const [verificationOutcome, setVerificationOutcome] = useState<WorkerVerificationOutcome | null>(
    caseData.pickerOutcome || (caseData.status === 'RESOLVED' ? 'FOUND' : null)
  );
  const [subAction, setSubAction] = useState<'PARTIALLY_FOUND' | 'DAMAGED' | 'ESCALATE_CUSTOM' | null>(null);
  const [customQty, setCustomQty] = useState<number>(caseData.qty > 1 ? caseData.qty - 1 : 1);
  const [escalationReason, setEscalationReason] = useState<string>('Inventory count discrepancy / Bin search exhausted');

  useEffect(() => {
    if (caseData.pickerOutcome) {
      setVerificationOutcome(caseData.pickerOutcome);
    }
    if (caseData.tier3AiAnalysis?.status === 'COMPLETED') {
      setTier3Completed(true);
    }
  }, [caseData.pickerOutcome, caseData.status, caseData.tier3AiAnalysis?.status]);

  const scannerList = SCANNER_TRANSACTIONS[caseData.sku] || [
    {
      time: '14:32',
      sku: caseData.sku,
      fromLocation: 'Receiving',
      toLocation: caseData.expectedLocation,
      qty: caseData.qty,
      type: 'Put-away',
      scannerId: 'Scanner 07',
    },
    {
      time: '14:35',
      sku: caseData.sku,
      fromLocation: caseData.expectedLocation,
      toLocation: caseData.recommendedLocation || 'B07',
      qty: caseData.qty,
      type: 'Transfer',
      scannerId: 'Scanner 07',
    },
  ];

  // Staleness check
  const isStale = caseData.evidenceTierUsed === 'STALE';
  const isConflicting = caseData.evidenceTierUsed === 'CONFLICTING';
  const isInsufficient = caseData.evidenceTierUsed === 'INSUFFICIENT';

  // Tier 3 Eligibility check: threshold >= ₹5,000 or high priority or repeated checks
  const isTier3Eligible = (caseData.itemValue || 0) >= 5000 || caseData.priority === 'HIGH' || caseData.tier3AiAnalysis?.eligible;

  // Run Tier 3 prototype AI analysis
  const handleRunTier3Analysis = () => {
    if (!isTier3Eligible) return;
    setIsAiRunning(true);
    setTimeout(() => {
      setIsAiRunning(false);
      setTier3Completed(true);
    }, 1200);
  };

  // Supervisor completes resolution
  const handleSupervisorConfirm = (outcome: WorkerVerificationOutcome, qtyOverride?: number, customNote?: string) => {
    setVerificationOutcome(outcome);
    setSubAction(null);

    const isResolved = outcome === 'FOUND';
    const verifiedLocation = isResolved
      ? (caseData.recommendedLocation || caseData.expectedLocation)
      : '—';

    let reason = customNote || '';
    if (!reason) {
      if (outcome === 'FOUND') {
        reason = `Supervisor audited physical item presence at ${verifiedLocation}.`;
      } else if (outcome === 'NOT_FOUND') {
        reason = `Supervisor verified item absent at ${caseData.recommendedLocation || caseData.expectedLocation}. Escalated.`;
      } else if (outcome === 'PARTIALLY_FOUND') {
        reason = `Partial quantity confirmed: ${qtyOverride || customQty} of ${caseData.qty} units.`;
      } else if (outcome === 'DAMAGED') {
        reason = 'Supervisor verified damaged/unusable stock. Sent for RTV/write-off processing.';
      }
    }

    onCompleteResolution({
      sku: caseData.sku,
      itemName: caseData.item,
      expectedLocation: caseData.expectedLocation,
      verifiedLocation,
      resolutionTime: '02:41',
      evidence: `Tier ${activeTierTab === 'tier-3' ? '3' : activeTierTab === 'tier-2' ? '2' : '1'} Evidence Chain`,
      status: isResolved ? 'Resolved' : 'Escalated',
      outcome,
      foundQuantity: qtyOverride || customQty,
      discrepancyReason: reason,
    });
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto w-full pb-12">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToOpenCases}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Return to case list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {caseData.id}
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-sm font-bold text-slate-900">{caseData.item}</span>
              {caseData.priority === 'HIGH' && (
                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                  High Priority
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Reported at {caseData.reportedAt || '14:34'} by {caseData.reportedBy || 'Picker'} &bull; Pick Task: {caseData.orderNumber || 'ORD-88201'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {onRequestRecheck && (
            <button
              onClick={() => onRequestRecheck(caseData.id)}
              className="text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-md cursor-pointer transition-colors"
            >
              Request Floor Re-check
            </button>
          )}

          {onResetCase && (
            <button
              onClick={onResetCase}
              className="text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-md cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3 inline mr-1" />
              Reset Case
            </button>
          )}
        </div>
      </div>

      {/* Trust Principle Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span>
            <strong>Operational Principle:</strong> StockTrace recommends. Humans verify. Algorithmic recommendations never adjust inventory autonomously.
          </span>
        </div>
        <span className="text-[10px] text-slate-400 hidden md:inline shrink-0 font-mono">
          Bengaluru DC SOP 4.1
        </span>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* COLUMN 1: CASE SUMMARY & PICKER RESPONSE (3 COLS) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Case Summary
            </span>
            <h2 className="text-sm font-bold text-slate-900 mt-0.5">
              {caseData.item}
            </h2>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">SKU:</span>
              <span className="font-mono font-bold text-slate-900">{caseData.sku}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Expected Location:</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                {caseData.expectedLocation}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Expected Quantity:</span>
              <span className="font-semibold text-slate-900">{caseData.qty} units</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Tote / Pick Task:</span>
              <span className="font-mono text-slate-700">{caseData.destinationBin || 'TOTE-44'} ({caseData.orderNumber || 'ORD-88201'})</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Item Unit Value:</span>
              <span className="font-mono font-semibold text-slate-900">
                ₹{(caseData.itemValue || 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Picker's Submitted Response */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 block text-[11px]">Picker Floor Report:</span>
              {caseData.pickerOutcome ? (
                <div className="mt-1 p-2 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{caseData.pickerOutcome}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{caseData.pickerTimestamp || 'Today'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {caseData.pickerNotes || 'Picker submitted physical verification on mobile terminal.'}
                  </p>
                </div>
              ) : (
                <span className="text-slate-400 italic text-[11px]">Awaiting floor picker confirmation</span>
              )}
            </div>
          </div>

          {/* Full Audit Trail Snippet */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center space-x-1 text-slate-700 text-xs font-bold">
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail ({caseData.auditTrail?.length || 2} events)</span>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono">
              {(caseData.auditTrail || [
                {
                  id: 'AUD-1',
                  timestamp: caseData.reportedAt || '14:34',
                  actor: 'Picker',
                  action: 'FAILED_PICK',
                  details: 'Item missing from expected bin.',
                },
                {
                  id: 'AUD-2',
                  timestamp: '14:35',
                  actor: 'Evidence Engine',
                  action: 'TIER_1_EVALUATED',
                  details: 'Evaluated scanner transactions.',
                },
              ]).map((evt, idx) => (
                <div key={idx} className="p-1.5 rounded bg-slate-50 border border-slate-100 text-slate-600 space-y-0.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{evt.action}</span>
                    <span className="text-[10px] text-slate-400">{evt.timestamp}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{evt.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2: THREE INVESTIGATION TIERS (5 COLS) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Evidence Engine
              </span>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                3 Investigation Tiers
              </h2>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
              Grounded Evidence
            </span>
          </div>

          {/* Tier Selector Pills */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTierTab('tier-1')}
              className={`py-1.5 px-2 rounded-md transition-colors cursor-pointer text-center ${
                activeTierTab === 'tier-1'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tier 1: Scanner
            </button>
            <button
              onClick={() => setActiveTierTab('tier-2')}
              className={`py-1.5 px-2 rounded-md transition-colors cursor-pointer text-center ${
                activeTierTab === 'tier-2'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tier 2: Camera
            </button>
            <button
              onClick={() => setActiveTierTab('tier-3')}
              className={`py-1.5 px-2 rounded-md transition-colors cursor-pointer text-center ${
                activeTierTab === 'tier-3'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tier 3: AI Video
            </button>
          </div>

          {/* WARNING BANNERS (Stale, Conflicting, Insufficient) */}
          {isStale && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Stale Evidence Warning (&gt; 2 Hours Old)</span>
              </div>
              <p className="text-amber-950 text-[11px] leading-relaxed">
                Last recorded movement occurred 28 hours ago. Old movement events do not prove current physical presence. Physical verification required.
              </p>
            </div>
          )}

          {isConflicting && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-700" />
                <span>Conflicting Evidence Signals</span>
              </div>
              <p className="text-rose-950 text-[11px] leading-relaxed">
                Scanner indicates transfer toward B07, while camera footage suggests movement toward C19. Recommendation halted to prevent incorrect pick.
              </p>
            </div>
          )}

          {isInsufficient && (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                <AlertCircle className="w-4 h-4 text-slate-600" />
                <span>Insufficient Tier 1 Evidence</span>
              </div>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                No movements recorded since put-away. StockTrace refuses to propose an arbitrary location.
              </p>
            </div>
          )}

          {/* TIER 1 VIEW: TRANSACTION & SCANNER */}
          {activeTierTab === 'tier-1' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold uppercase tracking-wider text-slate-500">
                  Handheld Scanner Movement Stream
                </span>
                <span className="text-teal-700 font-semibold">Cost: ₹0 (Default)</span>
              </div>

              <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden font-mono text-[11px]">
                {scannerList.map((s, idx) => (
                  <div key={idx} className="p-2 border-b border-slate-200 last:border-b-0 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800">{s.time}</span> &bull; <span>{s.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{s.fromLocation} &rarr; </span>
                      <strong className="text-slate-900">{s.toLocation}</strong>
                    </div>
                    <span className="text-slate-400 text-[10px]">{s.scannerId}</span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Deterministic evidence rules evaluate SKU recency, origin, and destination timestamps.
              </p>
            </div>
          )}

          {/* TIER 2 VIEW: TARGETED CAMERA EVIDENCE */}
          {activeTierTab === 'tier-2' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold uppercase tracking-wider text-slate-500">
                  Targeted Pre-recorded Camera Feed
                </span>
                <span className="text-indigo-700 font-semibold">Low Overhead</span>
              </div>

              {caseData.cameraEvidence?.status === 'BLIND_SPOT' ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center space-y-1">
                  <Video className="w-6 h-6 text-slate-400 mx-auto" />
                  <div className="font-bold text-slate-800 text-xs">Camera Blind Spot / Feed Offline</div>
                  <p className="text-[11px] text-slate-500">
                    Aisle 7 camera is unmonitored or obscured. Relies strictly on Tier 1 scanner evidence.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-900 text-slate-200 rounded-lg p-3 space-y-2.5 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800 pb-1.5">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>{caseData.cameraEvidence?.cameraId || 'CAM-04-AISLE-3'}</span>
                    </span>
                    <span>{caseData.cameraEvidence?.timestamp || '14:34:18'}</span>
                  </div>

                  <div className="bg-slate-950 rounded p-2.5 border border-slate-800 text-[11px] space-y-1">
                    <div className="text-teal-400 font-semibold">Visual Observation:</div>
                    <p className="text-slate-300">
                      {caseData.cameraEvidence?.observation || 'Floor associate cart observed departing A12 toward Bin B07.'}
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-400 italic">
                    <strong>Limitation:</strong> {caseData.cameraEvidence?.limitation || 'Viewing angle does not show shelf interior; verification required.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TIER 3 VIEW: CONDITIONAL AI VIDEO ANALYSIS */}
          {activeTierTab === 'tier-3' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold uppercase tracking-wider text-slate-500">
                  Conditional Prototype AI Video Analysis
                </span>
                <span className="text-purple-700 font-semibold font-mono">Est. Compute: ₹120</span>
              </div>

              {/* Guardrail Check: Is item eligible? */}
              {!isTier3Eligible ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Blocked by Cost Guardrail</span>
                  </div>
                  <p className="text-amber-950 text-[11px] leading-relaxed">
                    Item value (₹{(caseData.itemValue || 0).toLocaleString('en-IN')}) is below the ₹5,000 threshold required for automated AI video frame analysis.
                  </p>
                  <p className="text-[10px] text-amber-800">
                    Prevents unprofitable compute spend on low-value inventory exceptions.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-950 space-y-1 text-xs">
                    <div className="font-bold flex items-center space-x-1">
                      <Cpu className="w-3.5 h-3.5 text-purple-700" />
                      <span>High-Value Exception Eligible</span>
                    </div>
                    <p className="text-[11px]">
                      Item value ₹{(caseData.itemValue || 0).toLocaleString('en-IN')} meets threshold for prototype computer vision frame verification.
                    </p>
                  </div>

                  {tier3Completed ? (
                    <div className="bg-slate-900 text-slate-200 rounded-lg p-3 space-y-2 border border-slate-800 text-xs">
                      <div className="flex justify-between items-center text-[11px] text-purple-400 font-mono">
                        <span>FRAME MATCH &bull; CONFIDENCE 92%</span>
                        <span>ANALYSIS COMPLETE</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {caseData.tier3AiAnalysis?.analysisSummary || 'Multi-frame visual recognition confirmed manufacturer seal match placed into Bay E02/E14.'}
                      </p>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                        Compute cost ₹120 logged to facility operational analysis ledger.
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleRunTier3Analysis}
                      disabled={isAiRunning}
                      className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-2xs transition-colors"
                    >
                      {isAiRunning ? (
                        <>
                          <Cpu className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing CCTV Frame Sequence...</span>
                        </>
                      ) : (
                        <>
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Run Prototype AI Video Analysis (~₹120)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUMN 3: RESOLUTION & SUPERVISOR VERIFICATION (4 COLS) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Resolution State
            </span>
            <h2 className="text-sm font-bold text-slate-900 mt-0.5">
              Recommendation &amp; Actions
            </h2>
          </div>

          {/* Suggested Location Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] text-slate-500 font-medium block">
              Suggested next location:
            </span>
            <div className="text-2xl font-mono font-bold text-teal-800">
              {caseData.recommendedLocation && !isInsufficient && !isConflicting
                ? caseData.recommendedLocation
                : '—'}
            </div>
            <div className="text-[11px] text-slate-500">
              {caseData.landmarkHint || 'Requires physical verification'}
            </div>
          </div>

          {/* Status Attributes */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Evidence status:</span>
              <span className="font-semibold text-slate-900">
                {caseData.evidenceTierUsed?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Floor verification:</span>
              <span className="font-bold text-slate-900">
                {caseData.pickerOutcome || 'Pending check'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Case status:</span>
              <span className={`font-bold ${caseData.status === 'RESOLVED' ? 'text-emerald-700' : 'text-slate-900'}`}>
                {caseData.status}
              </span>
            </div>
          </div>

          {/* Supervisor Decision Controls */}
          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
            <span className="text-[11px] font-bold text-slate-700 block">
              Authorized Supervisor Actions:
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-supervisor-confirm-found"
                onClick={() => handleSupervisorConfirm('FOUND')}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm Found</span>
              </button>

              <button
                id="btn-supervisor-mark-not-found"
                onClick={() => handleSupervisorConfirm('NOT_FOUND')}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Mark Not Found</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <button
                onClick={() => setSubAction(subAction === 'PARTIALLY_FOUND' ? null : 'PARTIALLY_FOUND')}
                className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Log partial count
              </button>
              <button
                onClick={() => handleSupervisorConfirm('DAMAGED')}
                className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Log damaged stock
              </button>
              <button
                onClick={() => setSubAction(subAction === 'ESCALATE_CUSTOM' ? null : 'ESCALATE_CUSTOM')}
                className="text-rose-600 hover:text-rose-900 underline cursor-pointer"
              >
                Escalate case
              </button>
            </div>

            {/* Sub-form: Partial count */}
            {subAction === 'PARTIALLY_FOUND' && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 mt-2">
                <span className="text-[11px] font-semibold text-slate-700 block">
                  Audited count physically present:
                </span>
                <div className="flex space-x-1.5">
                  <input
                    type="number"
                    min="1"
                    max={caseData.qty}
                    value={customQty}
                    onChange={(e) => setCustomQty(Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-slate-300 rounded font-mono text-xs bg-white"
                  />
                  <button
                    onClick={() => handleSupervisorConfirm('PARTIALLY_FOUND', customQty)}
                    className="flex-1 py-1 bg-slate-900 text-white rounded text-xs font-semibold cursor-pointer"
                  >
                    Confirm {customQty} Units
                  </button>
                </div>
              </div>
            )}

            {/* Sub-form: Custom Escalation */}
            {subAction === 'ESCALATE_CUSTOM' && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg space-y-1.5 mt-2">
                <span className="text-[11px] font-semibold text-rose-900 block">
                  Reason for supervisor escalation:
                </span>
                <input
                  type="text"
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  className="w-full px-2 py-1 border border-rose-300 rounded text-xs bg-white text-slate-800"
                />
                <button
                  onClick={() => handleSupervisorConfirm('NOT_FOUND', undefined, escalationReason)}
                  className="w-full py-1 bg-rose-700 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Confirm Escalation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

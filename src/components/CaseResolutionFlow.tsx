import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ArrowLeft,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Mail,
} from 'lucide-react';
import { FailedPickCase, ScenarioType, WorkerVerificationOutcome } from '../types';
import { CameraVideoPlayerModal, CameraFootageItem } from './CameraVideoPlayerModal';
import {
  stockTraceEngine,
  runInvestigation,
  verifyCase,
  InvestigationExecutionResult,
} from '../harness';
import { SCANNER_TRANSACTIONS, CAMERA_EVENTS } from '../data/mockData';
import { stockTraceNotifier, SendEmailResult } from '../services/email';

interface CaseResolutionFlowProps {
  caseData: FailedPickCase;
  scenario: ScenarioType;
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
}

type FlowStep =
  | 'item-not-found'
  | 'finding-item'
  | 'where-to-look'
  | 'result-found'
  | 'result-not-found';

export const CaseResolutionFlow: React.FC<CaseResolutionFlowProps> = ({
  caseData,
  scenario,
  onCompleteResolution,
  onBackToOpenCases,
}) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('item-not-found');

  // Scenario state (can be initialized from prop or determined by caseData, and switchable)
  const [activeScenario, setActiveScenario] = useState<ScenarioType>(() => {
    if (caseData.id === 'CASE-3015') return 'conflict';
    if (caseData.id === 'CASE-2081') return 'no-camera';
    return scenario || 'happy-path';
  });

  // Keep in sync if parent changes scenario prop
  useEffect(() => {
    if (scenario) {
      setActiveScenario(scenario);
    }
  }, [scenario]);

  // StockTrace Case Engine Integration
  const [investigationResult, setInvestigationResult] = useState<InvestigationExecutionResult | null>(null);

  useEffect(() => {
    stockTraceEngine.registerCase({
      case_id: caseData.id,
      sku: caseData.sku,
      item_name: caseData.item,
      expected_location: caseData.expectedLocation,
      expected_quantity: caseData.qty,
    });

    const isStale = activeScenario === 'stale';
    let scannerData = SCANNER_TRANSACTIONS[caseData.sku] || [];
    let cameraData = CAMERA_EVENTS[caseData.sku] || [];

    if (activeScenario === 'scanner-only') {
      cameraData = [];
    } else if (activeScenario === 'camera-only') {
      scannerData = [];
    } else if (activeScenario === 'stale') {
      // Historical timestamps older than the 2-hour threshold (>3 hours old relative to 14:40)
      scannerData = scannerData.map((s) => ({ ...s, time: '11:15' }));
      cameraData = cameraData.map((c) => ({ ...c, exactTime: '11:18', timeRange: '11:16 – 11:20' }));
    }

    try {
      const res = runInvestigation(caseData.id, scannerData, cameraData, {
        forceScenario: (activeScenario === 'conflict' || activeScenario === 'no-camera') ? activeScenario : undefined,
        isStale,
        referenceNow: '14:40',
      });
      setInvestigationResult(res);
    } catch (e) {
      console.error('StockTrace investigation error:', e);
    }
  }, [caseData, activeScenario]);

  // Automatic investigation checklist on Screen 2
  const [investigationChecks, setInvestigationChecks] = useState({
    recentActivity: false,
    cameraFootage: false,
    movementTracking: false,
  });

  // Camera video player modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [selectedFootage, setSelectedFootage] = useState<CameraFootageItem | null>(null);

  // Outbound Email Notification feedback state
  const [emailNotificationResult, setEmailNotificationResult] = useState<SendEmailResult | null>(null);

  // Worker verification state
  const [lastOutcome, setLastOutcome] = useState<WorkerVerificationOutcome | null>(null);
  const [activeSubAction, setActiveSubAction] = useState<
    'PARTIALLY_FOUND' | 'WRONG_QUANTITY' | 'DAMAGED' | null
  >(null);
  const [partialCount, setPartialCount] = useState<number>(
    caseData.qty > 1 ? caseData.qty - 1 : 1
  );
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [damageNotes, setDamageNotes] = useState<string>('Packaging crushed / inventory unusable');

  // Derive active camera events based on scenario and SKU
  const currentCameraEvents =
    activeScenario === 'no-camera' || activeScenario === 'scanner-only'
      ? []
      : activeScenario === 'conflict'
      ? (CAMERA_EVENTS['SKU-3015'] || [])
      : (CAMERA_EVENTS[caseData.sku] || CAMERA_EVENTS['SKU-1042'] || []);

  const cameraFootageList: CameraFootageItem[] = currentCameraEvents.map((evt, idx) => ({
    id: `cam-${evt.frameVisualType || idx}`,
    cameraName: evt.camera,
    date: evt.date || '16 Sep 2026',
    timestamp: evt.exactTime || '2:35 PM',
    timeWindow: evt.timeRange || '2:32 PM – 2:35 PM',
    zone: evt.camera.includes('AISLE')
      ? 'Aisle 3'
      : evt.camera.includes('A12')
      ? 'Bay A12'
      : evt.camera.includes('C03')
      ? 'Bay C03'
      : 'Bay B07',
    description: evt.eventDescription,
    type: evt.frameVisualType,
    sourceLocation: evt.sourceLocation || 'A12',
    targetLocation: evt.destinationLocation || (evt.frameVisualType === 'c03' ? 'C03' : 'B07'),
    movementPath: `${evt.sourceLocation || 'A12'} → ${evt.destinationLocation || (evt.frameVisualType === 'c03' ? 'C03' : 'B07')}`,
    sku: caseData.sku,
  }));

  // Screen 2: Automatic investigation timer that moves automatically to result
  useEffect(() => {
    if (currentStep === 'finding-item') {
      const t1 = setTimeout(() => {
        setInvestigationChecks((prev) => ({ ...prev, recentActivity: true }));
      }, 600);

      const t2 = setTimeout(() => {
        setInvestigationChecks((prev) => ({ ...prev, cameraFootage: true }));
      }, 1200);

      const t3 = setTimeout(() => {
        setInvestigationChecks((prev) => ({ ...prev, movementTracking: true }));
      }, 1800);

      const t4 = setTimeout(() => {
        setCurrentStep('where-to-look');
      }, 2500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [currentStep]);

  const handleStartInvestigation = () => {
    setInvestigationChecks({
      recentActivity: false,
      cameraFootage: false,
      movementTracking: false,
    });
    setCurrentStep('finding-item');
  };

  const handleVerifyOutcome = (
    outcome: WorkerVerificationOutcome,
    actualQty?: number,
    notes?: string
  ) => {
    setLastOutcome(outcome);
    setActiveSubAction(null);
    const recommendedLoc = investigationResult?.evaluation.topCandidate?.location || 'B07';

    if (outcome === 'FOUND') {
      setCurrentStep('result-found');
      verifyCase({
        caseId: caseData.id,
        outcome: 'FOUND',
        verifiedLocation: recommendedLoc,
        actualQuantity: caseData.qty,
        role: 'OPERATOR',
      });

      onCompleteResolution({
        sku: caseData.sku,
        itemName: caseData.item,
        expectedLocation: caseData.expectedLocation,
        verifiedLocation: recommendedLoc,
        resolutionTime: '02:41',
        evidence: `StockTrace verified (${caseData.expectedLocation} → ${recommendedLoc})`,
        status: 'Resolved',
        outcome: 'FOUND',
        foundQuantity: caseData.qty,
      });
      return;
    }

    setCurrentStep('result-not-found');
    verifyCase({
      caseId: caseData.id,
      outcome,
      verifiedLocation: outcome === 'NOT_FOUND' ? undefined : recommendedLoc,
      actualQuantity: actualQty,
      notes,
      role: 'OPERATOR',
    });

    let evidenceSummary = '';
    let discrepancyReason = '';

    if (outcome === 'NOT_FOUND') {
      evidenceSummary =
        activeScenario === 'conflict'
          ? 'Conflicting information between scanner and camera'
          : activeScenario === 'no-camera'
          ? 'No useful camera footage available'
          : `Item physically absent at recommended location ${recommendedLoc || 'B07'}`;
      discrepancyReason = `Item physically checked at ${recommendedLoc || 'recommended location'}; item absent.`;

      // OUTBOUND ACTION TRIGGER:
      if (activeScenario === 'conflict') {
        stockTraceNotifier
          .notifyConflictingEvidence({
            caseId: caseData.id,
            sku: caseData.sku,
            itemName: caseData.item,
            expectedLocation: caseData.expectedLocation,
            scannerEvidenceSummary:
              investigationResult?.evaluation.scannerEvidenceSummary ||
              `Last recorded location: ${caseData.expectedLocation}`,
            cameraEvidenceSummary:
              investigationResult?.evaluation.cameraEvidenceSummary ||
              'Movement observed toward C03',
            status: 'Conflicting Evidence',
            actionDirective: 'Physical verification required.',
          })
          .then((res) => setEmailNotificationResult(res))
          .catch(() => {});
      } else {
        stockTraceNotifier
          .notifyEscalationRequired({
            caseId: caseData.id,
            sku: caseData.sku,
            itemName: caseData.item,
            expectedLocation: caseData.expectedLocation,
            recommendedLocation: recommendedLoc || undefined,
            scannerEvidenceSummary: investigationResult?.evaluation.scannerEvidenceSummary,
            cameraEvidenceSummary: investigationResult?.evaluation.cameraEvidenceSummary,
            status: 'Verification Required',
            actionDirective: recommendedLoc
              ? `Please physically verify recommended location ${recommendedLoc}.`
              : 'Please inspect warehouse bin and inventory records.',
          })
          .then((res) => setEmailNotificationResult(res))
          .catch(() => {});
      }
    } else if (outcome === 'PARTIALLY_FOUND') {
      const found = actualQty ?? 1;
      evidenceSummary = `Partially found ${found} of ${caseData.qty} at ${recommendedLoc}`;
      discrepancyReason = `Partial pick: ${found} of ${caseData.qty} located at ${recommendedLoc}. Missing balance: ${caseData.qty - found}.`;
    } else if (outcome === 'WRONG_QUANTITY') {
      const found = actualQty ?? 0;
      evidenceSummary = `Quantity discrepancy: expected ${caseData.qty}, found ${found}`;
      discrepancyReason = `Inventory count mismatch at ${recommendedLoc}: expected ${caseData.qty}, counted ${found}.`;
    } else if (outcome === 'DAMAGED') {
      evidenceSummary = `Damaged stock located at ${recommendedLoc}`;
      discrepancyReason = `Damaged inventory reported at ${recommendedLoc}: ${notes || 'Packaging damaged / unpickable'}.`;
    } else if (outcome === 'ESCALATE') {
      evidenceSummary = `Floor picker escalated case ${caseData.id} directly to supervisor`;
      discrepancyReason = `Manual escalation by floor associate: ${notes || 'Immediate supervisor review required'}.`;
    }

    onCompleteResolution({
      sku: caseData.sku,
      itemName: caseData.item,
      expectedLocation: caseData.expectedLocation,
      verifiedLocation: outcome === 'NOT_FOUND' ? '—' : recommendedLoc,
      resolutionTime: '03:15',
      evidence: evidenceSummary,
      status: 'Escalated',
      outcome,
      foundQuantity: actualQty,
      discrepancyReason,
    });
  };

  const handleFound = () => handleVerifyOutcome('FOUND');
  const handleNotFound = () => handleVerifyOutcome('NOT_FOUND');
  const handleWrongQuantity = (actualQty: number = 0) => handleVerifyOutcome('WRONG_QUANTITY', actualQty);

  const openCameraPlayer = (footageIdOrEvent?: string | CameraFootageItem | (typeof currentCameraEvents)[0]) => {
    let item: CameraFootageItem | undefined;
    if (typeof footageIdOrEvent === 'string') {
      item = cameraFootageList.find((f) => f.id === footageIdOrEvent || f.cameraName === footageIdOrEvent);
    } else if (footageIdOrEvent && 'camera' in footageIdOrEvent) {
      item = cameraFootageList.find((f) => f.cameraName === footageIdOrEvent.camera);
    } else if (footageIdOrEvent && 'cameraName' in footageIdOrEvent) {
      item = footageIdOrEvent as CameraFootageItem;
    }
    setSelectedFootage(item || cameraFootageList[0] || null);
    setIsVideoModalOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 w-full">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <button
          onClick={onBackToOpenCases}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Open Cases</span>
        </button>

        <div className="flex items-center space-x-2.5">
          <select
            id="scenario-switcher"
            aria-label="Demo Scenario"
            value={activeScenario}
            onChange={(e) => setActiveScenario(e.target.value as ScenarioType)}
            className="text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md px-2 py-1 cursor-pointer"
            title="Switch investigation scenario"
          >
            <option value="happy-path">Agree (Try B07)</option>
            <option value="conflict">Conflict (No match)</option>
            <option value="no-camera">No Footage</option>
            <option value="scanner-only">Scanner Only</option>
            <option value="camera-only">Camera Only</option>
            <option value="stale">Stale Data (&gt;2h)</option>
          </select>

          <span className="font-mono text-xs font-bold text-slate-500">
            {caseData.sku}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 1: CASE DETAILS                                                    */}
      {/* ========================================================================= */}
      {currentStep === 'item-not-found' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-4">
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                ITEM NOT FOUND
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {caseData.item}
            </h2>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-sm">
              <div className="flex items-center space-x-2 text-slate-700">
                <span className="text-slate-400 font-medium w-32">SKU:</span>
                <span className="font-mono font-bold text-slate-900">{caseData.sku}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <span className="text-slate-400 font-medium w-32">Quantity:</span>
                <span className="font-bold text-slate-900">{caseData.qty}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <span className="text-slate-400 font-medium w-32">Expected location:</span>
                <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {caseData.expectedLocation}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              id="btn-start-investigation"
              onClick={handleStartInvestigation}
              className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white text-base font-black rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>FIND THIS ITEM &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: FINDING YOUR ITEM...                                           */}
      {/* ========================================================================= */}
      {currentStep === 'finding-item' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-xs space-y-6 text-center">
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              FINDING YOUR ITEM...
            </h2>
          </div>

          <div className="max-w-xs mx-auto text-left space-y-3 pt-2">
            {/* Step 1: Recent activity */}
            <div className="flex items-center space-x-3 text-sm">
              {investigationChecks.recentActivity ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400 shrink-0" />
              )}
              <span className={`font-semibold ${investigationChecks.recentActivity ? 'text-slate-900' : 'text-slate-500'}`}>
                Checking recent activity
              </span>
            </div>

            {/* Step 2: Camera footage */}
            <div className="flex items-center space-x-3 text-sm">
              {investigationChecks.cameraFootage ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                </span>
              )}
              <span className={`font-semibold ${investigationChecks.cameraFootage ? 'text-slate-900' : 'text-slate-500'}`}>
                Checking camera footage
              </span>
            </div>

            {/* Step 3: Following the movement */}
            <div className="flex items-center space-x-3 text-sm">
              {investigationChecks.movementTracking ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                </span>
              )}
              <span className={`font-semibold ${investigationChecks.movementTracking ? 'text-slate-900' : 'text-slate-500'}`}>
                Following the movement
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: RECOMMENDATION (TRY B07 / WHAT WE FOUND)                       */}
      {/* ========================================================================= */}
      {currentStep === 'where-to-look' && (
        <div className="space-y-4">
          {/* ==================== SCENARIO 1: RECOMMENDATION (AGREE / STALE / SINGLE SOURCE) ==================== */}
          {(activeScenario === 'happy-path' ||
            activeScenario === 'scanner-only' ||
            activeScenario === 'camera-only' ||
            activeScenario === 'stale') &&
            investigationResult?.evaluation.confidenceState !== 'CONFLICTING' &&
            investigationResult?.evaluation.confidenceState !== 'NO_CAMERA' && (
            <div className="bg-white border-2 border-amber-500 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Main recommendation at the top */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {(activeScenario === 'stale' || investigationResult?.evaluation.confidenceState === 'LOW_STALE') && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <AlertTriangle className="w-3 h-3 text-amber-700" />
                      <span>STALE DATA (&gt; 2 HOURS)</span>
                    </span>
                  )}
                  {activeScenario === 'scanner-only' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      SCANNER RECORD ONLY
                    </span>
                  )}
                  {activeScenario === 'camera-only' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      CAMERA VISUAL ONLY
                    </span>
                  )}
                </div>

                <h2 className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight">
                  {investigationResult?.evaluation.recommendationDisplay || 'TRY B07'}
                </h2>

                {/* Movement Path */}
                {investigationResult?.evaluation.movementPath && investigationResult.evaluation.movementPath.length > 1 && (
                  <div className="pt-1">
                    <div className="inline-flex items-center space-x-2 text-sm font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                      {investigationResult.evaluation.movementPath.map((step, idx) => (
                        <React.Fragment key={idx}>
                          {idx === 0 ? (
                            <span className="text-slate-400 line-through">{step}</span>
                          ) : idx === investigationResult.evaluation.movementPath.length - 1 ? (
                            <span className="text-amber-700 font-black">{step}</span>
                          ) : (
                            <span className="text-slate-700">{step}</span>
                          )}
                          {idx < investigationResult.evaluation.movementPath.length - 1 && (
                            <span className="text-slate-400">&rarr;</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Compact Combined Section: WHAT WE FOUND */}
              <div className="space-y-4 pt-3 border-t border-slate-200">
                <div className="text-xs font-black text-slate-400 tracking-wider uppercase">
                  WHAT WE FOUND
                </div>

                {/* SCANNER EVIDENCE */}
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    SCANNER EVIDENCE
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {investigationResult?.evaluation.scannerEvidenceSummary ||
                      `Last recorded at ${caseData.expectedLocation || 'A12'} · 2:34 PM`}
                  </p>
                  <p className="text-xs text-slate-600">
                    Put-away &bull; Qty {caseData.qty}
                  </p>
                  <p className="text-xs text-slate-500">
                    No movement was recorded after this.
                  </p>
                </div>

                {/* CAMERA EVIDENCE (CONSOLIDATED PER SPECIFICATION) */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    CAMERA EVIDENCE
                  </div>
                  {currentCameraEvents.length === 0 || activeScenario === 'scanner-only' ? (
                    <p className="text-sm font-semibold text-slate-800">
                      {investigationResult?.evaluation.cameraEvidenceSummary || 'No useful footage found.'}
                    </p>
                  ) : (
                    <div
                      id="camera-evidence-consolidated-card"
                      className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <p className="text-sm sm:text-base font-bold text-slate-950">
                          Possible movement from A12 toward B07
                        </p>
                        <div className="text-xs font-mono font-bold text-slate-600">
                          16 Sep 2026 · 2:32 PM – 2:37 PM
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/80">
                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Cameras:
                          </div>
                          <div className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5 font-mono">
                            <span>Bay A12</span>
                            <span className="text-slate-400">&rarr;</span>
                            <span>Aisle 3</span>
                            <span className="text-slate-400">&rarr;</span>
                            <span>Bay B07</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Movement sequence:
                          </div>
                          <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 font-mono">
                            <span className="bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">A12</span>
                            <span className="text-slate-400">&rarr;</span>
                            <span className="bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">Aisle 3</span>
                            <span className="text-slate-400">&rarr;</span>
                            <span className="bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">B07</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                        <button
                          id="btn-view-video-consolidated"
                          onClick={() => openCameraPlayer(cameraFootageList[0])}
                          className="w-full sm:w-auto py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl inline-flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs active:scale-98"
                        >
                          <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                          <span>VIEW VIDEO</span>
                        </button>

                        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                          3 sequential camera observations
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* WHY LOCATION? */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    WHY {investigationResult?.evaluation.topCandidate?.location || 'B07'}?
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {investigationResult?.evaluation.whyRationale ||
                      `The scanner record shows the item was last recorded at ${caseData.expectedLocation || 'A12'}. Camera footage shows movement toward B07.`}
                  </p>
                </div>
              </div>

              {/* Action Directive */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-400 font-medium">Therefore:</div>
                <p className="text-base sm:text-lg font-black text-slate-950 mt-0.5">
                  {investigationResult?.evaluation.directiveText || 'PLEASE CHECK B07.'}
                </p>
              </div>

              {/* Verification Action Bar (FOUND, NOT FOUND, PARTIALLY FOUND, WRONG QTY, DAMAGED, ESCALATE) */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    id="btn-outcome-found"
                    onClick={() => handleVerifyOutcome('FOUND')}
                    className="py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>FOUND</span>
                  </button>

                  <button
                    id="btn-outcome-not-found"
                    onClick={() => handleVerifyOutcome('NOT_FOUND')}
                    className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer border border-slate-300"
                  >
                    <XCircle className="w-4 h-4 text-slate-500" />
                    <span>NOT FOUND</span>
                  </button>
                </div>

                {/* Inline Exception Drawers */}
                {activeSubAction === 'PARTIALLY_FOUND' && (
                  <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                      <span>Enter Quantity Physically Located (Expected: {caseData.qty})</span>
                      <button
                        onClick={() => setActiveSubAction(null)}
                        className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min={1}
                        max={caseData.qty > 1 ? caseData.qty - 1 : 1}
                        value={partialCount}
                        onChange={(e) => setPartialCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-3 py-1.5 text-sm font-bold font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                      <button
                        id="btn-confirm-partial"
                        onClick={() => handleVerifyOutcome('PARTIALLY_FOUND', partialCount)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Confirm Partial Pick
                      </button>
                    </div>
                  </div>
                )}

                {activeSubAction === 'WRONG_QUANTITY' && (
                  <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                      <span>Total Quantity Physically Observed (Expected: {caseData.qty})</span>
                      <button
                        onClick={() => setActiveSubAction(null)}
                        className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={wrongCount}
                        onChange={(e) => setWrongCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 px-3 py-1.5 text-sm font-bold font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                      <button
                        id="btn-confirm-wrong-qty"
                        onClick={() => handleVerifyOutcome('WRONG_QUANTITY', wrongCount)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Log Count Discrepancy
                      </button>
                    </div>
                  </div>
                )}

                {activeSubAction === 'DAMAGED' && (
                  <div className="p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                      <span>Report Damaged Inventory</span>
                      <button
                        onClick={() => setActiveSubAction(null)}
                        className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <input
                      type="text"
                      value={damageNotes}
                      onChange={(e) => setDamageNotes(e.target.value)}
                      placeholder="Brief note on item condition..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                    <button
                      id="btn-confirm-damaged"
                      onClick={() => handleVerifyOutcome('DAMAGED', 0, damageNotes)}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Record Damaged Stock & Escalate
                    </button>
                  </div>
                )}

                {/* Exception Options Toolbar */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  <button
                    id="btn-toggle-partial"
                    onClick={() =>
                      setActiveSubAction((prev) => (prev === 'PARTIALLY_FOUND' ? null : 'PARTIALLY_FOUND'))
                    }
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer border ${
                      activeSubAction === 'PARTIALLY_FOUND'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    }`}
                  >
                    Partially Found
                  </button>

                  <button
                    id="btn-toggle-wrong-qty"
                    onClick={() =>
                      setActiveSubAction((prev) => (prev === 'WRONG_QUANTITY' ? null : 'WRONG_QUANTITY'))
                    }
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer border ${
                      activeSubAction === 'WRONG_QUANTITY'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    }`}
                  >
                    Wrong Quantity
                  </button>

                  <button
                    id="btn-toggle-damaged"
                    onClick={() =>
                      setActiveSubAction((prev) => (prev === 'DAMAGED' ? null : 'DAMAGED'))
                    }
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer border ${
                      activeSubAction === 'DAMAGED'
                        ? 'bg-rose-100 text-rose-900 border-rose-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    }`}
                  >
                    Damaged
                  </button>

                  <button
                    id="btn-direct-escalate"
                    onClick={() => handleVerifyOutcome('ESCALATE', 0, 'Floor picker manual escalation')}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                  >
                    Escalate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SCENARIO 2: CONFLICT ==================== */}
          {(activeScenario === 'conflict' ||
            investigationResult?.evaluation.confidenceState === 'CONFLICTING') && (
            <div className="bg-white border-2 border-rose-300 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <div>
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>CONFLICTING INFORMATION</span>
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                  NO RELIABLE LOCATION
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                  We found different information. No reliable location can be recommended.
                </p>
              </div>

              {/* Compact Combined Section: WHAT WE FOUND */}
              <div className="space-y-4 pt-3 border-t border-slate-200">
                <div className="text-xs font-black text-slate-400 tracking-wider uppercase">
                  WHAT WE FOUND
                </div>

                {/* SCANNER EVIDENCE */}
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    SCANNER EVIDENCE
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {investigationResult?.evaluation.scannerEvidenceSummary ||
                      `Last recorded at B07 · 11:40 AM`}
                  </p>
                  <p className="text-xs text-slate-600">
                    Put-away &bull; Qty {caseData.qty}
                  </p>
                </div>

                {/* CAMERA EVIDENCE */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    CAMERA EVIDENCE
                  </div>
                  {currentCameraEvents.length === 0 ? (
                    <p className="text-sm font-semibold text-slate-800">
                      {investigationResult?.evaluation.cameraEvidenceSummary || 'No useful footage found.'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {currentCameraEvents.map((evt, idx) => {
                        const formattedDateTime = evt.date
                          ? (evt.timeRange ? `${evt.date} · ${evt.timeRange}` : `${evt.date} · ${evt.exactTime}`)
                          : (evt.timeRange || evt.exactTime);

                        const cameraDisplayName = evt.camera
                          .replace('AISLE-3-CAM', 'Aisle 3')
                          .replace('A12-CAM', 'Bay A12')
                          .replace('B07-CAM', 'Bay B07')
                          .replace('-CAM', '');

                        return (
                          <div
                            key={idx}
                            id={`camera-conflict-event-${idx}`}
                            className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5"
                          >
                            <p className="text-sm font-semibold text-slate-900">
                              {evt.eventDescription || 'Movement appears toward C03.'}
                            </p>

                            <div className="space-y-0.5">
                              <div className="text-xs font-bold font-mono text-slate-900">
                                {formattedDateTime}
                              </div>
                              <div className="text-xs text-slate-600">
                                Camera: <span className="font-semibold text-slate-800">{cameraDisplayName}</span>
                              </div>
                            </div>

                            <div className="pt-0.5">
                              <button
                                id={`btn-view-video-conflict-${idx}`}
                                onClick={() => openCameraPlayer(evt)}
                                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl inline-flex items-center space-x-2 transition-colors cursor-pointer shadow-2xs"
                              >
                                <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                                <span>▶ VIEW VIDEO</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* WHY NO RECOMMENDATION? */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    WHY NO RECOMMENDATION?
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {investigationResult?.evaluation.whyRationale ||
                      `The scanner record shows the item was last recorded at B07, but camera footage indicates activity moving toward C03.`}
                  </p>
                </div>
              </div>

              {/* Action Directive & Send for Review */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="text-xs text-slate-400 font-medium">Therefore:</div>
                <p className="text-sm font-bold text-slate-900">
                  Do not guess. Send the case directly for warehouse supervisor review.
                </p>
                <button
                  id="btn-send-review-conflict"
                  onClick={handleNotFound}
                  className="w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span>SEND FOR REVIEW &rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* ==================== SCENARIO 3: NO CAMERA ==================== */}
          {(activeScenario === 'no-camera' ||
            (investigationResult?.evaluation.confidenceState === 'NO_CAMERA' &&
              activeScenario !== 'conflict')) && (
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <div>
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>NO FOOTAGE AVAILABLE</span>
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                  NO LOCATION RECOMMENDED
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                  We couldn't identify a reliable next location.
                </p>
              </div>

              {/* Compact Combined Section: WHAT WE FOUND */}
              <div className="space-y-4 pt-3 border-t border-slate-200">
                <div className="text-xs font-black text-slate-400 tracking-wider uppercase">
                  WHAT WE FOUND
                </div>

                {/* SCANNER EVIDENCE */}
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    SCANNER EVIDENCE
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {investigationResult?.evaluation.scannerEvidenceSummary ||
                      `Last recorded at ${caseData.expectedLocation || 'A12'} · 2:34 PM`}
                  </p>
                  <p className="text-xs text-slate-600">
                    Put-away &bull; Qty {caseData.qty}
                  </p>
                  <p className="text-xs text-slate-500">
                    No movement was recorded after this.
                  </p>
                </div>

                {/* CAMERA EVIDENCE */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    CAMERA EVIDENCE
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {investigationResult?.evaluation.cameraEvidenceSummary ||
                      'No useful footage found.'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Overhead cameras had no clear visual record of this item departing {caseData.expectedLocation || 'A12'}.
                  </p>
                </div>

                {/* WHY NO RECOMMENDATION? */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    WHY NO RECOMMENDATION?
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {investigationResult?.evaluation.whyRationale ||
                      `Scanner shows the item was placed at ${caseData.expectedLocation || 'A12'}, but camera footage is unavailable to verify any further movement.`}
                  </p>
                </div>
              </div>

              {/* Action Directive & Send for Review */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="text-xs text-slate-400 font-medium">Therefore:</div>
                <p className="text-sm font-bold text-slate-900">
                  Send the case for warehouse review.
                </p>
                <button
                  id="btn-send-review-no-camera"
                  onClick={handleNotFound}
                  className="w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span>SEND FOR REVIEW &rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4A: RESOLVED                                                      */}
      {/* ========================================================================= */}
      {currentStep === 'result-found' && (
        <div className="bg-white border-2 border-emerald-500 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                ✓ ITEM FOUND
              </h2>
              <p className="text-sm font-semibold text-emerald-800 mt-0.5">
                Found at B07
              </p>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 font-medium">
            Case completed.
          </div>

          <div className="pt-2">
            <button
              id="btn-return-open-cases"
              onClick={onBackToOpenCases}
              className="w-full sm:w-auto py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl inline-flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <span>BACK TO OPEN CASES &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4B: ESCALATED / DISCREPANCY / NOT FOUND                            */}
      {/* ========================================================================= */}
      {currentStep === 'result-not-found' && (
        <div className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                lastOutcome === 'PARTIALLY_FOUND' ||
                lastOutcome === 'WRONG_QUANTITY' ||
                lastOutcome === 'DAMAGED'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {lastOutcome === 'PARTIALLY_FOUND'
                  ? 'PARTIAL PICK RECORDED'
                  : lastOutcome === 'WRONG_QUANTITY'
                  ? 'COUNT DISCREPANCY RECORDED'
                  : lastOutcome === 'DAMAGED'
                  ? 'DAMAGED INVENTORY LOGGED'
                  : lastOutcome === 'ESCALATE'
                  ? 'ESCALATED TO SUPERVISOR'
                  : activeScenario === 'conflict' || activeScenario === 'no-camera'
                  ? 'CASE SENT FOR REVIEW'
                  : 'ITEM STILL NOT FOUND'}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                {lastOutcome === 'PARTIALLY_FOUND'
                  ? `Located ${partialCount} of ${caseData.qty} units at recommended location.`
                  : lastOutcome === 'WRONG_QUANTITY'
                  ? `Physical count was ${wrongCount} units (expected ${caseData.qty}).`
                  : lastOutcome === 'DAMAGED'
                  ? 'Item recorded as damaged and unusable.'
                  : lastOutcome === 'ESCALATE'
                  ? 'Manual escalation requested for warehouse supervisor review.'
                  : 'Item physically absent at recommended location.'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">
              {lastOutcome === 'PARTIALLY_FOUND' ||
              lastOutcome === 'WRONG_QUANTITY' ||
              lastOutcome === 'DAMAGED'
                ? 'An operational discrepancy has been logged and flagged for supervisor review.'
                : activeScenario === 'conflict'
                ? 'Conflicting information was detected between warehouse systems.'
                : activeScenario === 'no-camera'
                ? "We couldn't identify another reliable location from camera footage."
                : "We couldn't identify another reliable location."}
            </p>
            <p className="text-slate-600">
              {lastOutcome === 'PARTIALLY_FOUND' ||
              lastOutcome === 'WRONG_QUANTITY' ||
              lastOutcome === 'DAMAGED'
                ? 'Inventory records flagged for recount and bin audit.'
                : 'Case sent for warehouse review.'}
            </p>

            {/* Clean Outbound Email Dispatch Status */}
            {emailNotificationResult && (
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center space-x-2 text-[11px]">
                <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                {emailNotificationResult.success ? (
                  <span className="text-emerald-700 font-semibold">
                    Outbound escalation notification dispatched via Gmail to {emailNotificationResult.recipient}
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium">
                    Outbound alert logged: {emailNotificationResult.recipient} ({emailNotificationResult.error || 'Pending Authorization'})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              id="btn-return-open-cases-escalated"
              onClick={onBackToOpenCases}
              className="w-full sm:w-auto py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl inline-flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <span>BACK TO OPEN CASES &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      <CameraVideoPlayerModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        footage={selectedFootage}
        allFootage={cameraFootageList}
        onSelectNextFootage={(item) => setSelectedFootage(item)}
      />
    </div>
  );
};

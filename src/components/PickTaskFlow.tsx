import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Barcode,
  XCircle,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Clock,
  Scan,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Eye,
  ChevronRight,
  Boxes,
  Sparkles,
  Loader2,
  HelpCircle,
  UserCheck,
  Play,
} from 'lucide-react';
import { PickTask, ScenarioType } from '../types';
import { CameraFrameGraphic } from './CameraFrameGraphic';
import { EvidenceModal } from './EvidenceModal';
import { CameraPathTimeline } from './CameraPathTimeline';
import { CameraVideoPlayerModal, CameraFootageItem } from './CameraVideoPlayerModal';

interface PickTaskFlowProps {
  task: PickTask;
  scenario: ScenarioType;
  onCompleteResolution: (details: {
    sku: string;
    itemName: string;
    expectedLocation: string;
    verifiedLocation: string;
    resolutionTime: string;
    evidence: string;
    status: 'Resolved' | 'Escalated';
  }) => void;
  onBackToList: () => void;
  onResetTask?: () => void;
  onStepChange?: (
    step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 'wrong-qty',
    hasInvestigated: boolean
  ) => void;
}

export const PickTaskFlow: React.FC<PickTaskFlowProps> = ({
  task,
  scenario,
  onCompleteResolution,
  onBackToList,
  onResetTask,
  onStepChange,
}) => {
  // Main User Flow Steps (1 to 9):
  // 1: Pick Task
  // 2: Picker Arrives at Expected Location
  // 3: Item Not Found
  // 4: StockTrace Investigates
  // 5: What StockTrace Found
  // 6: Next Location to Check
  // 7: Picker Verifies the Location
  // 8: Resolved
  // 9: Not Resolved (Escalate)
  // 'wrong-qty': Wrong Item / Quantity discrepancy
  const [currentStep, setCurrentStepState] = useState<
    1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 'wrong-qty'
  >(() => {
    if (task.currentStep) return task.currentStep as any;
    return 1;
  });

  // Track if automatic investigation has run so Back navigation preserves state without re-running timers
  const [hasInvestigated, setHasInvestigatedState] = useState<boolean>(() => {
    return !!task.hasInvestigated || (task.currentStep ? task.currentStep >= 5 : false);
  });

  const setCurrentStep = (newStep: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 'wrong-qty') => {
    setCurrentStepState(newStep);
    onStepChange?.(newStep, hasInvestigated);
  };

  const setHasInvestigated = (val: boolean) => {
    setHasInvestigatedState(val);
    onStepChange?.(currentStep, val);
  };

  // In-app Back navigation returning to immediate previous screen without resetting state
  const handleBack = () => {
    if (currentStep === 1) {
      onBackToList();
    } else if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 4) {
      setCurrentStep(2);
    } else if (currentStep === 5) {
      setCurrentStep(2);
    } else if (currentStep === 6) {
      setCurrentStep(5);
    } else if (currentStep === 7) {
      setCurrentStep(6);
    } else if (currentStep === 8 || currentStep === 9 || currentStep === 'wrong-qty') {
      setCurrentStep(7);
    }
  };

  // Automatic investigation checklist progress (Step 4)
  const [investigationProgress, setInvestigationProgress] = useState({
    lastRecordedActivity: false,
    scannerActivity: false,
    cameraFootage: false,
    movementAnalysis: false,
  });

  // Camera progression on Step 5
  const [cameraStepsShown, setCameraStepsShown] = useState<number>(1);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);
  const [selectedFootage, setSelectedFootage] = useState<CameraFootageItem | null>(null);

  // User-facing camera footage list for Step 5
  const cameraFootageList: CameraFootageItem[] = [
    {
      id: 'cam-a12',
      cameraName: 'A12-CAM',
      timestamp: '2:34 PM',
      timeWindow: '2:33 – 2:35 PM',
      zone: 'Bay A12',
      description: 'Movement seen leaving A12',
      type: 'a12',
    },
    {
      id: 'cam-aisle3',
      cameraName: 'AISLE-3-CAM',
      timestamp: '2:35 PM',
      timeWindow: '2:34 – 2:36 PM',
      zone: 'Aisle 3',
      description: 'Movement appears to be heading toward B07',
      type: 'aisle3',
    },
    {
      id: 'cam-b07',
      cameraName: 'B07-CAM',
      timestamp: '2:36 PM',
      timeWindow: '2:35 – 2:37 PM',
      zone: 'Bay B07',
      description: 'Activity seen near B07',
      type: 'b07',
    },
  ];

  // Step 3 -> Step 4 automatic transition (Item Not Found -> Investigates)
  useEffect(() => {
    if (currentStep === 3) {
      const timer = setTimeout(() => {
        setCurrentStep(4);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Step 4: Staggered automated investigation progress sequence
  useEffect(() => {
    if (currentStep === 4) {
      if (hasInvestigated) {
        // If already investigated, keep all items checked and do not re-run timer
        setInvestigationProgress({
          lastRecordedActivity: true,
          scannerActivity: true,
          cameraFootage: true,
          movementAnalysis: true,
        });
        return;
      }

      setInvestigationProgress({
        lastRecordedActivity: false,
        scannerActivity: false,
        cameraFootage: false,
        movementAnalysis: false,
      });

      const t1 = setTimeout(() => {
        setInvestigationProgress((prev) => ({ ...prev, lastRecordedActivity: true }));
      }, 450);

      const t2 = setTimeout(() => {
        setInvestigationProgress((prev) => ({ ...prev, scannerActivity: true }));
      }, 1000);

      const t3 = setTimeout(() => {
        setInvestigationProgress((prev) => ({ ...prev, cameraFootage: true }));
      }, 1600);

      const t4 = setTimeout(() => {
        setInvestigationProgress((prev) => ({ ...prev, movementAnalysis: true }));
      }, 2200);

      const t5 = setTimeout(() => {
        setHasInvestigated(true);
        setCurrentStep(5);
      }, 2900);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
      };
    }
  }, [currentStep, hasInvestigated]);

  // Camera sequence animation for Step 5
  useEffect(() => {
    if (currentStep === 5) {
      setCameraStepsShown(1);
      const c1 = setTimeout(() => setCameraStepsShown(2), 600);
      const c2 = setTimeout(() => setCameraStepsShown(3), 1300);

      return () => {
        clearTimeout(c1);
        clearTimeout(c2);
      };
    }
  }, [currentStep]);

  const stepsList = [
    { num: 1, label: 'Pick Task' },
    { num: 2, label: 'At A12' },
    { num: 3, label: 'Not Found' },
    { num: 4, label: 'Investigating' },
    { num: 5, label: 'What Was Found' },
    { num: 6, label: 'Try B07' },
    { num: 7, label: 'Verify B07' },
    { num: 8, label: 'Resolved' },
  ];

  const getCurrentStepNum = (): number => {
    if (typeof currentStep === 'number') return currentStep;
    if (currentStep === 'wrong-qty') return 7;
    return 7;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Workflow Bar with In-App Back Navigation */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center space-x-2">
          <button
            id="btn-workflow-back"
            onClick={handleBack}
            className="inline-flex items-center space-x-2 py-2 px-3.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-2xs transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
            <span>&larr; Back</span>
          </button>

          <button
            id="btn-workflow-back-to-list"
            onClick={onBackToList}
            className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all cursor-pointer"
          >
            <Boxes className="w-3.5 h-3.5 text-slate-500" />
            <span>Tasks Queue</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="font-mono text-slate-500">
            Task: <strong className="text-slate-900 font-bold">{task.id}</strong> &bull; {task.sku}
          </span>
          {onResetTask && (
            <button
              id="btn-cancel-flow-top"
              onClick={onResetTask}
              className="text-xs text-rose-600 hover:text-rose-800 underline font-medium"
              title="Reset task status back to Pending"
            >
              Reset Task
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CORE PRINCIPLE BANNER                                                     */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Core Operational Principle
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-100">
            &ldquo;Human reports the problem. StockTrace investigates automatically. Human only verifies the physical result.&rdquo;
          </p>
          <p className="text-xs text-slate-400">
            Picker responsibilities: <strong className="text-amber-300">1. Press NOT FOUND</strong> &bull; <strong className="text-amber-300">2. Check recommended location</strong>
          </p>
        </div>
        <button
          id="btn-cancel-flow"
          onClick={onBackToList}
          className="shrink-0 text-xs text-slate-400 hover:text-white underline font-medium self-start sm:self-center"
        >
          Back to Queue
        </button>
      </div>

      {/* ========================================================================= */}
      {/* STEP PROGRESS TRACKER                                                     */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 px-4 shadow-2xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs pb-1">
          <div className="flex items-center space-x-1 shrink-0">
            {stepsList.map((s, idx) => {
              const currentNum = getCurrentStepNum();
              const isCurrent = currentNum === s.num;
              const isPast = currentNum > s.num;

              return (
                <React.Fragment key={s.num}>
                  <div
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all shrink-0 ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                        : isPast
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span>0{s.num}</span>
                    <span>{s.label}</span>
                  </div>
                  {idx < stepsList.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 01 — PICK TASK                                                            */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div id="screen-01-pick-task" className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-7">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              01 &bull; Pick Task
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Today's Pick Task</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow warehouse system routing to expected location.
            </p>
          </div>

          {/* Task Details Card */}
          <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-300">
                {task.sku}
              </span>
              <span className="text-xs font-medium text-slate-500">Order #{task.orderNumber}</span>
            </div>

            <div className="text-2xl font-bold text-slate-900">{task.item}</div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <span className="text-xs font-medium text-slate-500 block uppercase tracking-wider">
                  Quantity
                </span>
                <span className="text-3xl font-black text-slate-900">{task.qty}</span>
                <span className="text-xs text-slate-500 ml-1">units</span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 block uppercase tracking-wider">
                  Expected Location
                </span>
                <span className="text-3xl font-black font-mono text-slate-900">
                  {task.expectedLocation}
                </span>
              </div>
            </div>
          </div>

          <button
            id="btn-start-pick"
            onClick={() => setCurrentStep(2)}
            className="w-full py-4 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base flex items-center justify-center space-x-2 shadow-sm transition-all"
          >
            <span>[ START PICK ]</span>
            <ArrowRight className="w-5 h-5 text-amber-400" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 02 — PICKER ARRIVES AT EXPECTED LOCATION                                  */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div id="screen-02-at-location" className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-8">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                02 &bull; At Expected Location
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">{task.item}</h2>
              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                {task.sku}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-500 block uppercase tracking-wider">
                Instruction
              </span>
              <span className="text-xl font-black text-slate-900">Pick {task.qty} units</span>
            </div>
          </div>

          {/* Expected Location Display */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-8 text-center space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
              Expected Location
            </span>
            <div className="text-6xl font-black tracking-tight text-slate-900 py-1 font-mono">
              {task.expectedLocation}
            </div>
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 font-medium pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Location specified by warehouse system</span>
            </div>
          </div>

          {/* Normal Pick vs Not Found */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 text-center space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Standard Pick
                </span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  Item found at {task.expectedLocation}?
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm physical inventory count and complete pick.
                </p>
              </div>
              <button
                id="btn-item-found-expected"
                onClick={() =>
                  onCompleteResolution({
                    sku: task.sku,
                    itemName: task.item,
                    expectedLocation: task.expectedLocation,
                    verifiedLocation: task.expectedLocation,
                    resolutionTime: '01:24',
                    evidence: 'Standard pick at expected location',
                    status: 'Resolved',
                  })
                }
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>[ ITEM FOUND — COMPLETE PICK ]</span>
              </button>
            </div>

            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-5 text-center space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
                  Missing Item
                </span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  Item cannot be found at {task.expectedLocation}?
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Start StockTrace automatic camera investigation.
                </p>
              </div>
              <button
                id="btn-not-found-trigger"
                onClick={() => setCurrentStep(3)}
                className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>[ NOT FOUND ]</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 03 — ITEM NOT FOUND                                                       */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div id="screen-03-item-not-found" className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600 animate-pulse">
            <XCircle className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
              03 &bull; Item Not Found
            </span>
            <h2 className="text-3xl font-black text-slate-900">Item not found at {task.expectedLocation}.</h2>
            <p className="text-base font-medium text-slate-600 max-w-md mx-auto pt-1">
              StockTrace is checking what happened.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 max-w-md mx-auto flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            <span>Investigating automatically. No picker action required.</span>
          </div>

          <div className="pt-2">
            <button
              id="btn-continue-investigation"
              onClick={() => setCurrentStep(4)}
              className="text-xs text-slate-400 hover:text-slate-700 underline font-medium"
            >
              Continuing automatically to investigation...
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 04 — STOCKTRACE INVESTIGATES                                    */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div id="screen-04-investigating" className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-7">
          <div className="text-center space-y-2 pb-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>AUTOMATIC INVESTIGATION</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">StockTrace Investigates</h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Checking warehouse records and camera feeds for {task.sku} automatically.
            </p>
          </div>

          {/* Simple progress sequence requested by user */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4 text-sm max-w-lg mx-auto">
            {/* Item 1 */}
            <div className="flex items-center space-x-3.5">
              {investigationProgress.lastRecordedActivity ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                </div>
              )}
              <span
                className={
                  investigationProgress.lastRecordedActivity
                    ? 'text-emerald-800 font-semibold'
                    : 'text-slate-600'
                }
              >
                Checking the last recorded activity
              </span>
            </div>

            {/* Item 2 */}
            <div className="flex items-center space-x-3.5">
              {investigationProgress.scannerActivity ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                </div>
              )}
              <span
                className={
                  investigationProgress.scannerActivity
                    ? 'text-emerald-800 font-semibold'
                    : 'text-slate-400'
                }
              >
                Checking recent scanner activity
              </span>
            </div>

            {/* Item 3 */}
            <div className="flex items-center space-x-3.5">
              {investigationProgress.cameraFootage ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                </div>
              )}
              <span
                className={
                  investigationProgress.cameraFootage
                    ? 'text-emerald-800 font-semibold'
                    : 'text-slate-400'
                }
              >
                Checking relevant camera footage
              </span>
            </div>

            {/* Item 4 */}
            <div className="flex items-center space-x-3.5">
              {investigationProgress.movementAnalysis ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                </div>
              )}
              <span
                className={
                  investigationProgress.movementAnalysis
                    ? 'text-emerald-800 font-semibold'
                    : 'text-slate-400'
                }
              >
                Looking for where the item may have moved
              </span>
            </div>
          </div>

          <div className="pt-2 text-center">
            {hasInvestigated ? (
              <button
                id="btn-continue-to-found"
                onClick={() => setCurrentStep(5)}
                className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <span>[ VIEW WHAT WE FOUND &rarr; ]</span>
              </button>
            ) : (
              <button
                id="btn-skip-to-found"
                onClick={() => {
                  setHasInvestigated(true);
                  setCurrentStep(5);
                }}
                className="text-xs text-slate-400 hover:text-slate-700 underline font-medium"
              >
                Advancing automatically... (or click to view results)
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 05 — WHAT STOCKTRACE FOUND                                      */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <div id="screen-05-what-we-found" className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-7">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
              05 &bull; Investigation Findings
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Here&apos;s what we found.</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any camera card to inspect the recorded footage.
            </p>
          </div>

          {/* Special Scenario: Conflicting Information */}
          {scenario === 'conflict' ? (
            <div className="space-y-6">
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>We found conflicting camera information</span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">
                  Different camera feeds show conflicting movement paths.
                </p>
                <p className="text-xs text-slate-600">
                  StockTrace will not guess when information disagrees. Please escalate for warehouse review.
                </p>
              </div>

              <button
                id="btn-escalate-conflict"
                onClick={() =>
                  onCompleteResolution({
                    sku: task.sku,
                    itemName: task.item,
                    expectedLocation: task.expectedLocation,
                    verifiedLocation: 'Audit Needed',
                    resolutionTime: '02:40',
                    evidence: 'Conflicting Information',
                    status: 'Escalated',
                  })
                }
                className="w-full py-4 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-colors"
              >
                [ ESCALATE FOR WAREHOUSE REVIEW ]
              </button>
            </div>
          ) : scenario === 'no-camera' ? (
            /* Special Scenario: Not Enough Information */
            <div className="space-y-6">
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <span>We couldn&apos;t find enough camera footage to suggest a location</span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">
                  Camera footage shows no reliable signs of movement leaving {task.expectedLocation}.
                </p>
                <p className="text-xs text-slate-600">
                  StockTrace does not guess. Please escalate for warehouse review.
                </p>
              </div>

              <button
                id="btn-escalate-no-camera"
                onClick={() =>
                  onCompleteResolution({
                    sku: task.sku,
                    itemName: task.item,
                    expectedLocation: task.expectedLocation,
                    verifiedLocation: '—',
                    resolutionTime: '02:15',
                    evidence: 'Not Enough Information',
                    status: 'Escalated',
                  })
                }
                className="w-full py-4 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-colors"
              >
                [ ESCALATE FOR WAREHOUSE REVIEW ]
              </button>
            </div>
          ) : (
            /* Happy Path: Camera Movement Path */
            <div className="space-y-6">
              {/* Simple Explanation */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-sm text-slate-800">
                <div className="flex items-start space-x-3">
                  <span className="w-2 h-2 rounded-full bg-slate-800 mt-2 shrink-0" />
                  <span>
                    Camera footage shows movement leaving <strong>{task.expectedLocation}</strong> around <strong>2:34 PM</strong>.
                  </span>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 mt-2 shrink-0" />
                  <span>
                    Movement appears to continue toward <strong>B07</strong>.
                  </span>
                </div>
              </div>

              {/* Supporting Note */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center space-x-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Camera footage shows a movement path from A12 toward B07.</span>
              </div>

              {/* Movement Path Header */}
              <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm border border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Movement Path
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm font-mono font-bold">
                  <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-100">
                    A12
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                  <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-100">
                    Aisle 3
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                  <span className="bg-amber-500 text-slate-950 px-3.5 py-1.5 rounded-lg font-black shadow-xs">
                    B07
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>2:34 PM – 2:36 PM</span>
                </div>
              </div>

              {/* Interactive Camera Video Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">
                    Camera Footage (Click any card to inspect footage):
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    3 cameras recorded
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {cameraFootageList.map((footage) => (
                    <div
                      key={footage.id}
                      id={`card-footage-${footage.id}`}
                      onClick={() => setSelectedFootage(footage)}
                      className="group bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-amber-400/80 rounded-xl p-3.5 space-y-3 cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        {/* Video Thumbnail with Play Button Overlay */}
                        <div className="relative rounded-lg overflow-hidden border border-slate-700 aspect-video bg-black">
                          <CameraFrameGraphic
                            type={footage.type}
                            cameraName={footage.cameraName}
                            timestamp={footage.timestamp}
                            eventNote={footage.description}
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>
                          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-neutral-300">
                            00:05
                          </div>
                        </div>

                        {/* Camera Info */}
                        <div>
                          <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-800">
                            <span className="flex items-center space-x-1">
                              <Camera className="w-3.5 h-3.5 text-slate-500" />
                              <span>{footage.cameraName}</span>
                            </span>
                            <span className="text-slate-500">{footage.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium mt-1 leading-snug">
                            &quot;{footage.description}&quot;
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFootage(footage);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-slate-900 group-hover:bg-amber-500 text-white group-hover:text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>[ VIEW VIDEO ]</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Result */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5 text-sm text-slate-900 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span>
                    Movement appears to continue toward <strong>B07</strong>.
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
                  Camera trace complete
                </span>
              </div>

              {/* Action Button to Step 6 */}
              <button
                id="btn-advance-to-next-location"
                onClick={() => setCurrentStep(6)}
                className="w-full py-4 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base flex items-center justify-center space-x-2 shadow-sm transition-all"
              >
                <span>[ VIEW NEXT LOCATION TO CHECK ]</span>
                <ArrowRight className="w-5 h-5 text-amber-400" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 06 — NEXT LOCATION TO CHECK                                               */}
      {/* ========================================================================= */}
      {currentStep === 6 && (
        <div id="screen-06-next-location" className="bg-white border border-slate-200 rounded-xl p-8 shadow-md space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
              06 &bull; Recommended Location
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              NEXT LOCATION TO CHECK
            </h2>

            {/* Large, Clear Result: B07 */}
            <div className="inline-flex items-center justify-center space-x-3 bg-amber-500 text-slate-950 px-12 py-5 rounded-2xl shadow-sm border border-amber-400">
              <MapPin className="w-8 h-8 text-slate-950" />
              <span className="text-6xl font-black font-mono tracking-tight">B07</span>
            </div>

            <p className="text-sm font-semibold text-slate-800 max-w-md mx-auto">
              Camera footage suggests the item moved toward B07.
            </p>
          </div>

          {/* Why B07? Section */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <div className="bg-slate-100 px-5 py-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Why B07?
              </span>
            </div>

            <div className="p-5 space-y-3 text-sm text-slate-800">
              <div className="flex items-start space-x-3">
                <span className="w-2 h-2 rounded-full bg-slate-700 mt-2 shrink-0" />
                <span className="leading-relaxed">
                  Movement seen leaving <strong>A12</strong> around 2:34 PM
                </span>
              </div>

              <div className="flex items-start space-x-3">
                <span className="w-2 h-2 rounded-full bg-slate-700 mt-2 shrink-0" />
                <span className="leading-relaxed">
                  Movement appears to be heading through <strong>Aisle 3</strong> at 2:35 PM
                </span>
              </div>

              <div className="flex items-start space-x-3">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mt-2 shrink-0" />
                <span className="leading-relaxed">
                  Activity seen near <strong>B07</strong> at 2:36 PM
                </span>
              </div>
            </div>
          </div>

          {/* Instruction & Safeguard */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start space-x-3">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block text-sm mb-0.5">Physical verification required.</span>
              <span>Please check B07. The item is not guaranteed to be there until you verify it in person.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              id="btn-check-b07"
              onClick={() => setCurrentStep(7)}
              className="w-full py-4 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base flex items-center justify-center space-x-2 shadow-sm transition-all"
            >
              <MapPin className="w-5 h-5 text-amber-400" />
              <span>[ CHECK B07 ]</span>
            </button>

            <button
              id="btn-view-evidence-dossier"
              onClick={() => setIsEvidenceModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>[ VIEW DETAILS ]</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 07 — PICKER VERIFIES THE LOCATION                                         */}
      {/* ========================================================================= */}
      {currentStep === 7 && (
        <div id="screen-07-verify-location" className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-7">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
              07 &bull; Verify Location
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Check Location B07</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The picker physically checks B07 and reports the result.
            </p>
          </div>

          {/* Item details card */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-slate-700">{task.sku}</div>
              <div className="text-xl font-bold text-slate-900">{task.item}</div>
              <div className="text-xs text-slate-500">
                Required quantity: <strong>{task.qty}</strong> units
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Location</span>
              <span className="text-4xl font-black font-mono text-slate-900">B07</span>
            </div>
          </div>

          {/* Verification Question */}
          <div className="text-center space-y-4 pt-2">
            <p className="text-lg font-bold text-slate-900">Did you find the item?</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                id="btn-verify-found"
                onClick={() => setCurrentStep(8)}
                className="py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>[ FOUND ]</span>
              </button>

              <button
                id="btn-verify-not-found"
                onClick={() => setCurrentStep(9)}
                className="py-4 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-base flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <XCircle className="w-5 h-5" />
                <span>[ NOT FOUND ]</span>
              </button>
            </div>

            {/* Optional Nuance button: Wrong Item / Quantity */}
            <div className="pt-2">
              <button
                id="btn-verify-wrong"
                onClick={() => setCurrentStep('wrong-qty')}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
              >
                Item present but wrong quantity or different item? Click here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 08 — RESOLVED                                                             */}
      {/* ========================================================================= */}
      {currentStep === 8 && (
        <div id="screen-08-resolved" className="bg-white border border-slate-200 rounded-xl p-8 shadow-md space-y-7">
          <div className="text-center space-y-2 pb-2">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">&check; RESOLVED</h2>
            <p className="text-sm font-semibold text-emerald-700">
              {task.sku} was found at B07.
            </p>
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 divide-y divide-slate-200 text-xs">
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Item</span>
              <span className="font-bold text-slate-900 text-sm">{task.item}</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Expected Location</span>
              <span className="font-mono font-bold text-rose-700 line-through text-sm">
                {task.expectedLocation}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Found Location</span>
              <span className="font-mono font-black text-emerald-700 text-base bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                B07
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Resolution Time</span>
              <span className="font-mono font-bold text-slate-900 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>04:12</span>
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Information Used</span>
              <span className="font-bold text-slate-900">Camera footage</span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <div className="font-bold">Next steps:</div>
            <p className="text-emerald-800">
              The location discrepancy has been recorded in warehouse audit history. Continue with order.
            </p>
          </div>

          <button
            id="btn-complete-resolution"
            onClick={() =>
              onCompleteResolution({
                sku: task.sku,
                itemName: task.item,
                expectedLocation: task.expectedLocation,
                verifiedLocation: 'B07',
                resolutionTime: '04:12',
                evidence: 'Camera footage',
                status: 'Resolved',
              })
            }
            className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm transition-colors"
          >
            [ COMPLETE ]
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 09 — NOT RESOLVED (ESCALATE)                                              */}
      {/* ========================================================================= */}
      {currentStep === 9 && (
        <div id="screen-09-not-resolved" className="bg-white border border-rose-200 rounded-xl p-8 shadow-xs space-y-6 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-700">
            <XCircle className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
              09 &bull; Not Resolved
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">NOT RESOLVED</h2>
            <p className="text-base font-bold text-slate-800 max-w-md mx-auto">
              Item still not found.
            </p>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              StockTrace could not identify another location.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 max-w-md mx-auto text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Locations Checked:</span>
              <span className="font-bold text-slate-900">A12, B07</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-rose-700">No further location could be identified automatically.</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 max-w-md mx-auto">
            StockTrace has completed its automatic investigation. The case now needs warehouse review.
          </div>

          <button
            id="btn-escalate-exhausted"
            onClick={() =>
              onCompleteResolution({
                sku: task.sku,
                itemName: task.item,
                expectedLocation: task.expectedLocation,
                verifiedLocation: 'Still Not Found',
                resolutionTime: '05:40',
                evidence: 'Checked A12 and B07',
                status: 'Escalated',
              })
            }
            className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl transition-colors shadow-xs tracking-wider"
          >
            [ ESCALATE ]
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECONDARY OUTCOME — WRONG ITEM / QUANTITY                                 */}
      {/* ========================================================================= */}
      {currentStep === 'wrong-qty' && (
        <div id="screen-wrong-qty" className="bg-white border border-amber-200 rounded-xl p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Wrong Item or Quantity at B07</h2>
            <p className="text-xs text-slate-500">
              Physical inventory found at B07 did not match required order manifest.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Location Checked:</span>
              <span className="font-bold text-slate-900">B07</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Discrepancy:</span>
              <span className="font-bold text-amber-800">Quantity / Item Mismatch</span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <strong>Discrepancy recorded.</strong> An audit task is scheduled for bin B07.
          </div>

          <button
            id="btn-log-partial-discrepancy"
            onClick={() =>
              onCompleteResolution({
                sku: task.sku,
                itemName: task.item,
                expectedLocation: task.expectedLocation,
                verifiedLocation: 'B07 (Mismatch)',
                resolutionTime: '05:01',
                evidence: 'Camera footage (Mismatch)',
                status: 'Escalated',
              })
            }
            className="w-full py-3.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition-colors"
          >
            [ RECORD DISCREPANCY & ESCALATE ]
          </button>
        </div>
      )}

      {/* Interactive Camera Video Player Modal */}
      <CameraVideoPlayerModal
        isOpen={!!selectedFootage}
        footage={selectedFootage}
        onClose={() => setSelectedFootage(null)}
        allFootage={cameraFootageList}
        onSelectNextFootage={(f) => setSelectedFootage(f)}
      />

      {/* Evidence Modal Dossier (Full transparency) */}
      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        sku={task.sku}
        expectedLocation={task.expectedLocation}
        recommendedLocation="B07"
        scenario={scenario}
      />
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  MapPin,
  Check,
  Package,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  AlertCircle,
  Cpu,
  Search,
  ExternalLink,
  Send,
  X,
  Sparkles,
  Info,
  Clock,
  FileText,
  Layers,
} from 'lucide-react';
import { FailedPickCase, WorkerVerificationOutcome } from '../../types';
import { DEMO_SCENARIOS, DemoScenario, executeScenarioInvestigation } from './demoScenarios';
import { PICKER_I18N, PickerLang } from './pickerI18n';
import {
  DispatchOrder,
  WAREHOUSE_DISPATCH_ORDERS,
  matchDispatchOrder,
  getOrCreateInvestigationTaskId,
  extractReportedQuantity,
} from '../../services/dispatch/dispatchService';
import { investigationOrchestrator } from '../../orchestrator/investigationOrchestrator';
import { traceLogger } from '../../services/observability/traceLogger';

interface PickerWhatsAppViewProps {
  cases: FailedPickCase[];
  activeCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onPickerVerification: (details: {
    caseId: string;
    sku: string;
    itemName: string;
    expectedLocation: string;
    verifiedLocation: string;
    outcome: WorkerVerificationOutcome;
    foundQuantity?: number;
    notes?: string;
  }) => void;
  onResetCase: (caseId: string) => void;
  onSwitchToSupervisor: (caseId?: string) => void;
}

type MessageSender = 'system' | 'picker';

interface ConversationMessage {
  id: string;
  sender: MessageSender;
  timestamp: string;
  type:
    | 'PICKER_REPORT'
    | 'ORDER_MATCHED_CONFIRMATION'
    | 'TASK_ASSIGNED_PROGRESS'
    | 'REC_SUPPORTED'
    | 'REC_INSUFFICIENT'
    | 'REC_CONFLICTING'
    | 'REC_STALE'
    | 'REC_LESS_QTY'
    | 'REC_DAMAGED'
    | 'REC_HIGH_VALUE'
    | 'TIER3_COMPLETED'
    | 'PICKER_FOUND'
    | 'PICKER_NOT_FOUND_RECOMMENDED'
    | 'PICKER_LESS_QTY'
    | 'PICKER_DAMAGED'
    | 'RESOLVED_SUMMARY'
    | 'ESCALATED_SUMMARY';
  payload?: {
    qty?: number;
    item?: string;
    bin?: string;
    fromBin?: string;
    toBin?: string;
    time?: string;
    landmark?: string;
    reason?: string;
    scannerLoc?: string;
    scannerTime?: string;
    cameraLoc?: string;
    cameraTime?: string;
    staleLoc?: string;
    hoursOld?: number;
    itemValue?: number;
    costInr?: number;
    foundQty?: number;
    totalQty?: number;
    damageReason?: string;
    customText?: string;
    taskId?: string;
    orderId?: string;
    sku?: string;
    reportedQty?: number;
    discrepancy?: number;
    traceId?: string;
  };
}

export const PickerWhatsAppView: React.FC<PickerWhatsAppViewProps> = ({
  cases,
  activeCaseId,
  onSelectCase,
  onPickerVerification,
  onResetCase,
  onSwitchToSupervisor,
}) => {
  // 1. Active Demo Scenario (Simulated Demo Data)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario-1');

  const currentScenario =
    DEMO_SCENARIOS.find((s) => s.id === selectedScenarioId) || DEMO_SCENARIOS[0];

  const currentCase =
    cases.find((c) => c.sku === currentScenario.sku) ||
    cases.find((c) => c.id === currentScenario.caseId) ||
    cases[0];

  // 2. Language State (English, Hindi, Kannada)
  const [selectedLang, setSelectedLang] = useState<PickerLang>('en');

  // 3. Audio / Speech Synthesis State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [activeSpeechText, setActiveSpeechText] = useState<string>('');

  // 4. Voice Input & Speech-to-Text State
  const [reportInputText, setReportInputText] = useState<string>('');
  const [isRecordingSpeech, setIsRecordingSpeech] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // 5. Workflow Stage State:
  // 'welcome' -> Initial screen: StockTrace branding, opening prompt, mic button, text fallback, quick examples. NO task or SKU shown.
  // 'investigating' -> Dispatch order identified, investigation task assigned, checking movement records.
  // 'recommendation_active' -> Evidence gathered, conversational reply & recommendation shown. Picker sees 4 verification buttons.
  // 'resolved' -> Verified found by picker.
  // 'escalated' -> Escalated to supervisor.
  const [stage, setStage] = useState<'welcome' | 'investigating' | 'recommendation_active' | 'resolved' | 'escalated'>('welcome');

  // Assigned Dispatch & Task Details (Populated ONLY after picker reports problem)
  const [assignedTask, setAssignedTask] = useState<{
    taskId: string;
    orderId: string;
    sku: string;
    itemName: string;
    requiredQty: number;
    expectedBin: string;
    locationDescription: string;
    reportedQty?: number;
    discrepancy?: number;
  } | null>(null);

  // Messages thread
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [recommendedBin, setRecommendedBin] = useState<string | null>(null);

  // Tier 3 AI state
  const [isTier3Running, setIsTier3Running] = useState<boolean>(false);
  const [tier3Completed, setTier3Completed] = useState<boolean>(false);

  // Drawers / Discrepancy Modals
  const [showLessQtyDrawer, setShowLessQtyDrawer] = useState<boolean>(false);
  const [showDamageDrawer, setShowDamageDrawer] = useState<boolean>(false);
  const [customFoundQty, setCustomFoundQty] = useState<number>(1);
  const [selectedDamageType, setSelectedDamageType] = useState<string>('Cracked packaging / Broken seal');

  // Chat scroll anchor
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const getCurrentTime = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Detect browser SpeechRecognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
      setSpeechRecognitionSupported(Boolean(SpeechRecognitionClass));
    }
  }, []);

  // Initialize or reset scenario state
  const initScenario = (scenario: DemoScenario) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setIsPlayingAudio(false);
    setIsRecordingSpeech(false);
    setSpeechError(null);
    setReportInputText('');
    setShowLessQtyDrawer(false);
    setShowDamageDrawer(false);
    setRecommendedBin(null);
    setIsTier3Running(false);
    setTier3Completed(false);
    setMessages([]);
    setAssignedTask(null);
    setStage('welcome');
    setActiveSpeechText(PICKER_I18N.welcome.openingMessage[selectedLang]);
    setCustomFoundQty(scenario.qty > 1 ? Math.floor(scenario.qty / 2) || 1 : 1);
  };

  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const target = DEMO_SCENARIOS.find((s) => s.id === scenarioId) || DEMO_SCENARIOS[0];
    onSelectCase(target.caseId);
    initScenario(target);
  };

  const handleResetCurrentDemo = () => {
    initScenario(currentScenario);
    onResetCase(currentScenario.caseId);
  };

  useEffect(() => {
    initScenario(currentScenario);
  }, [selectedScenarioId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, stage, isTier3Running, showLessQtyDrawer, showDamageDrawer]);

  // Keep speech text in sync with language switches
  useEffect(() => {
    if (stage === 'welcome') {
      setActiveSpeechText(PICKER_I18N.welcome.openingMessage[selectedLang]);
    } else if (messages.length > 0) {
      const lastSystemMsg = [...messages].reverse().find((m) => m.sender === 'system');
      if (lastSystemMsg) {
        setActiveSpeechText(renderMessageText(lastSystemMsg, selectedLang));
      }
    }
  }, [selectedLang, stage]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Browser Text-To-Speech
  const handlePlayVoice = (textOverride?: string) => {
    const textToSpeak = textOverride || activeSpeechText;
    if (!textToSpeak) return;

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 2000);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      if (selectedLang === 'hi') {
        utterance.lang = 'hi-IN';
      } else if (selectedLang === 'kn') {
        utterance.lang = 'kn-IN';
      } else {
        utterance.lang = 'en-IN';
      }

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  // Browser Speech-To-Text Toggle
  const handleToggleSpeechRecognition = () => {
    if (isRecordingSpeech) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecordingSpeech(false);
      return;
    }

    if (typeof window === 'undefined') return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;

    if (!SpeechRecognitionClass) {
      setSpeechError(PICKER_I18N.voiceModal.speechNotSupported[selectedLang]);
      return;
    }

    try {
      setSpeechError(null);
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;

      if (selectedLang === 'hi') {
        recognition.lang = 'hi-IN';
      } else if (selectedLang === 'kn') {
        recognition.lang = 'kn-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsRecordingSpeech(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setReportInputText(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsRecordingSpeech(false);
        if (event.error !== 'no-speech') {
          setSpeechError(`Microphone notice: ${event.error}. Please type below.`);
        }
      };

      recognition.onend = () => {
        setIsRecordingSpeech(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecordingSpeech(false);
      setSpeechError(PICKER_I18N.voiceModal.speechNotSupported[selectedLang]);
    }
  };

  // =========================================================================
  // CORE WORKFLOW: PICKER REPORTS PROBLEM -> IDENTIFY DISPATCH -> ASSIGN TASK -> GATHER EVIDENCE -> RESPOND
  // =========================================================================
  const handleSubmitReport = (textToSend?: string) => {
    const rawReport = (textToSend || reportInputText).trim();
    if (!rawReport) return;

    // Stop active speech recognition if running
    if (isRecordingSpeech && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecordingSpeech(false);
    }

    // 1. Add Picker's report as a chat message bubble
    const pickerMsg: ConversationMessage = {
      id: `msg-picker-${Date.now()}`,
      sender: 'picker',
      timestamp: getCurrentTime(),
      type: 'PICKER_REPORT',
      payload: { customText: rawReport },
    };

    setMessages([pickerMsg]);
    setStage('investigating');
    setReportInputText('');

    // 2. Identify the Dispatch Order using inventory and order records
    const matchResult = matchDispatchOrder(rawReport, selectedScenarioId);
    const matchedOrder = matchResult.order;
    const assignedTaskId = getOrCreateInvestigationTaskId(matchedOrder.orderId);

    // Create telemetry trace
    const activeTrace = traceLogger.createTrace({
      caseId: currentScenario.caseId,
      operatorRole: 'PICKER',
      scenarioId: selectedScenarioId,
      taskId: assignedTaskId,
    });

    // Save assigned task state (populated ONLY after report submission)
    const taskData = {
      taskId: assignedTaskId,
      orderId: matchedOrder.orderId,
      sku: matchedOrder.sku,
      itemName: matchedOrder.itemName,
      requiredQty: matchedOrder.requiredQuantity,
      expectedBin: matchedOrder.expectedBin,
      locationDescription: matchedOrder.locationDescription || matchedOrder.landmarkHint || 'Assigned bay slot',
      reportedQty: matchResult.reportedQuantity,
      discrepancy: matchResult.quantityDiscrepancy,
    };
    setAssignedTask(taskData);

    // 3. Display StockTrace Confirmation & Task Assignment Details
    setTimeout(() => {
      const orderConfirmationMsg: ConversationMessage = {
        id: `msg-sys-matched-${Date.now()}`,
        sender: 'system',
        timestamp: getCurrentTime(),
        type: 'ORDER_MATCHED_CONFIRMATION',
        payload: {
          taskId: assignedTaskId,
          orderId: matchedOrder.orderId,
          sku: matchedOrder.sku,
          item: matchedOrder.itemName,
          qty: matchedOrder.requiredQuantity,
          bin: matchedOrder.expectedBin,
          landmark: matchedOrder.locationDescription,
          reportedQty: matchResult.reportedQuantity,
          discrepancy: matchResult.quantityDiscrepancy,
          traceId: activeTrace.traceId,
        },
      };

      const progressMsg: ConversationMessage = {
        id: `msg-sys-prog-${Date.now() + 1}`,
        sender: 'system',
        timestamp: getCurrentTime(),
        type: 'TASK_ASSIGNED_PROGRESS',
      };

      setMessages((prev) => [...prev, orderConfirmationMsg, progressMsg]);

      // 4. Gather Evidence & Run StockTrace Evidence Engine
      setTimeout(() => {
        try {
          // Pass sample inventory, scanner, and camera data to evidence engine
          const investigationRes = executeScenarioInvestigation(currentScenario);
          const { evaluation } = investigationRes;

          // Remove temporary progress indicator
          setMessages((prev) => prev.filter((m) => m.type !== 'TASK_ASSIGNED_PROGRESS'));

          // Inspect Scenario Outcome
          const outcomeType = currentScenario.expectedOutcomeType;

          if (outcomeType === 'FOUND_EXPECTED' || rawReport.toLowerCase().includes('found at assigned') || rawReport.toLowerCase().includes('found at bin')) {
            // Scenario 1: Picker verified item found at expected bin
            const resMsg: ConversationMessage = {
              id: `msg-sys-res-${Date.now()}`,
              sender: 'system',
              timestamp: getCurrentTime(),
              type: 'RESOLVED_SUMMARY',
              payload: { bin: matchedOrder.expectedBin },
            };
            setMessages((prev) => [...prev, resMsg]);
            setStage('resolved');
            setActiveSpeechText(PICKER_I18N.messages.caseResolvedMessage(matchedOrder.expectedBin)[selectedLang]);

            onPickerVerification({
              caseId: currentScenario.caseId,
              sku: matchedOrder.sku,
              itemName: matchedOrder.itemName,
              expectedLocation: matchedOrder.expectedBin,
              verifiedLocation: matchedOrder.expectedBin,
              outcome: 'FOUND',
              foundQuantity: matchedOrder.requiredQuantity,
              notes: `Physically verified and found at expected bin ${matchedOrder.expectedBin}. Pick completed.`,
            });
          } else if (outcomeType === 'LESS_QUANTITY' || matchResult.reportedQuantity !== undefined) {
            // Scenario 6: Less Quantity Discrepancy (e.g. 6 of 10)
            const reportedFound = matchResult.reportedQuantity ?? (currentScenario.qty > 1 ? Math.floor(currentScenario.qty * 0.6) : 1);
            const discrepancyCount = matchedOrder.requiredQuantity - reportedFound;

            const lessQtyMsg: ConversationMessage = {
              id: `msg-sys-less-${Date.now()}`,
              sender: 'system',
              timestamp: getCurrentTime(),
              type: 'REC_LESS_QTY',
              payload: {
                foundQty: reportedFound,
                totalQty: matchedOrder.requiredQuantity,
                discrepancy: discrepancyCount,
                bin: matchedOrder.expectedBin,
              },
            };
            setMessages((prev) => [...prev, lessQtyMsg]);
            setRecommendedBin(matchedOrder.expectedBin);
            setStage('recommendation_active');
            setActiveSpeechText(
              `Dispatch order requires ${matchedOrder.requiredQuantity} units, but ${reportedFound} units were reported. A shortage discrepancy of ${discrepancyCount} units has been logged for supervisor review.`
            );
          } else if (outcomeType === 'DAMAGED' || matchResult.isDamagedReported) {
            // Scenario 7: Damaged Stock Report
            const dmgReason = 'Cracked packaging / Broken seal';
            const dmgMsg: ConversationMessage = {
              id: `msg-sys-dmg-${Date.now()}`,
              sender: 'system',
              timestamp: getCurrentTime(),
              type: 'REC_DAMAGED',
              payload: {
                bin: matchedOrder.expectedBin,
                damageReason: dmgReason,
              },
            };
            setMessages((prev) => [...prev, dmgMsg]);
            setRecommendedBin(matchedOrder.expectedBin);
            setStage('recommendation_active');
            setActiveSpeechText(
              PICKER_I18N.messages.pickerReportedDamaged(dmgReason)[selectedLang]
            );
          } else if (outcomeType === 'INSUFFICIENT' || evaluation.confidenceState === 'INSUFFICIENT_EVIDENCE') {
            // Scenario 3: Insufficient Evidence -> Refuse to invent location
            const insuffMsg: ConversationMessage = {
              id: `msg-sys-insuff-${Date.now()}`,
              sender: 'system',
              timestamp: getCurrentTime(),
              type: 'REC_INSUFFICIENT',
            };
            setMessages((prev) => [...prev, insuffMsg]);
            setRecommendedBin(null);
            setStage('recommendation_active');
            setActiveSpeechText(PICKER_I18N.messages.recommendationInsufficient[selectedLang]);
          } else if (outcomeType === 'CONFLICTING' || evaluation.confidenceState === 'CONFLICTING') {
            // Scenario 4: Conflicting Evidence (Scanner B07 vs Camera C19)
            const conflictMsg: ConversationMessage = {
              id: `msg-sys-conflict-${Date.now()}`,
              sender: 'system',
              timestamp: getCurrentTime(),
              type: 'REC_CONFLICTING',
              payload: {
                scannerLoc: 'B07',
                scannerTime: '11:35',
                cameraLoc: 'C19',
                cameraTime: '11:38',
              },
            };
            setMessages((prev) => [...prev, conflictMsg]);
            setRecommendedBin(null);
            setStage('recommendation_active');
            setActiveSpeechText(
              PICKER_I18N.messages.recommendationConflicting('B07', '11:35', 'C19', '11:38')[selectedLang]
            );
          } else if (outcomeType === 'STALE' || evaluation.confidenceState === 'LOW_STALE') {
            // Scenario 5: Stale Evidence (28 hours old)
            const staleMsg: ConversationMessage = {
              id: `msg-sys-stale-${Date.now()}`,
              sender: 'system',
              timestamp: getCurrentTime(),
              type: 'REC_STALE',
              payload: {
                staleLoc: 'D04',
                hoursOld: 28,
              },
            };
            setMessages((prev) => [...prev, staleMsg]);
            setRecommendedBin('D04');
            setStage('recommendation_active');
            setActiveSpeechText(PICKER_I18N.messages.recommendationStale('D04', 28)[selectedLang]);
          } else if (outcomeType === 'HIGH_VALUE_TIER3') {
            // Scenario 8: High-Value Exception (Simulated Tier 3 AI)
            const highValMsg: ConversationMessage = {
              id: `msg-sys-hv-${Date.now()}`,
              sender: 'system',
              timestamp: getCurrentTime(),
              type: 'REC_HIGH_VALUE',
              payload: {
                itemValue: currentScenario.itemValue || 18000,
                costInr: 120,
              },
            };
            setMessages((prev) => [...prev, highValMsg]);
            setStage('recommendation_active');
            setActiveSpeechText(
              PICKER_I18N.messages.recommendationHighValue(currentScenario.itemValue || 18000, 120)[selectedLang]
            );
          } else {
            // Scenario 2: Supported Alternate Location (B07)
            const targetLoc = evaluation.topCandidate?.location || 'B07';
            const recMsg: ConversationMessage = {
              id: `msg-sys-rec-${Date.now()}`,
              sender: 'system',
              timestamp: getCurrentTime(),
              type: 'REC_SUPPORTED',
              payload: {
                fromBin: matchedOrder.expectedBin,
                toBin: targetLoc,
                time: '14:35',
                landmark: 'near the blue rack, bottom shelf',
              },
            };
            setMessages((prev) => [...prev, recMsg]);
            setRecommendedBin(targetLoc);
            setStage('recommendation_active');
            setActiveSpeechText(
              PICKER_I18N.messages.recommendationSupported(
                matchedOrder.expectedBin,
                targetLoc,
                '14:35',
                'near the blue rack, bottom shelf'
              )[selectedLang]
            );
          }
        } catch {
          setStage('welcome');
        }
      }, 700);
    }, 450);
  };

  // Run Simulated Tier 3 AI Video Analysis for High-Value item
  const handleRunTier3Simulated = () => {
    setIsTier3Running(true);
    setTimeout(() => {
      setIsTier3Running(false);
      setTier3Completed(true);
      setRecommendedBin('E14');

      const tier3Msg: ConversationMessage = {
        id: `msg-sys-tier3-${Date.now()}`,
        sender: 'system',
        timestamp: getCurrentTime(),
        type: 'TIER3_COMPLETED',
        payload: {
          toBin: 'E14',
          costInr: 120,
        },
      };

      setMessages((prev) => [...prev, tier3Msg]);
      const voiceText = PICKER_I18N.messages.tier3AnalysisCompleted('E14')[selectedLang];
      setActiveSpeechText(voiceText);
    }, 1200);
  };

  // =========================================================================
  // VERIFICATION WORKFLOW ACTIONS (Section 7 Requirements)
  // Only available after StockTrace responds with recommendation
  // =========================================================================

  // Verification Action 1: Found Here
  const handleFoundHere = () => {
    const loc = recommendedBin || 'B07';
    const order = assignedTask;

    const pickerMsg: ConversationMessage = {
      id: `msg-pick-found-rec-${Date.now()}`,
      sender: 'picker',
      timestamp: getCurrentTime(),
      type: 'PICKER_FOUND',
      payload: { bin: loc },
    };

    const confirmMsg: ConversationMessage = {
      id: `msg-sys-res-${Date.now() + 1}`,
      sender: 'system',
      timestamp: getCurrentTime(),
      type: 'RESOLVED_SUMMARY',
      payload: { bin: loc },
    };

    setMessages((prev) => [...prev, pickerMsg, confirmMsg]);
    setStage('resolved');

    const voiceText = PICKER_I18N.messages.caseResolvedMessage(loc)[selectedLang];
    setActiveSpeechText(voiceText);

    onPickerVerification({
      caseId: currentScenario.caseId,
      sku: order?.sku || currentScenario.sku,
      itemName: order?.itemName || currentScenario.item,
      expectedLocation: order?.expectedBin || currentScenario.expectedLocation,
      verifiedLocation: loc,
      outcome: 'FOUND',
      foundQuantity: order?.requiredQty || currentScenario.qty,
      notes: `Physically checked and verified at suggested bin ${loc}. WMS pick verified.`,
    });
  };

  // Verification Action 2: Still Not Found
  const handleStillNotFound = () => {
    const loc = recommendedBin || 'B07';
    const order = assignedTask;

    const pickerMsg: ConversationMessage = {
      id: `msg-pick-not-found-${Date.now()}`,
      sender: 'picker',
      timestamp: getCurrentTime(),
      type: 'PICKER_NOT_FOUND_RECOMMENDED',
      payload: { bin: loc },
    };

    const escalateMsg: ConversationMessage = {
      id: `msg-sys-esc-${Date.now() + 1}`,
      sender: 'system',
      timestamp: getCurrentTime(),
      type: 'ESCALATED_SUMMARY',
      payload: {
        reason: `Item missing at suggested bin ${loc}. No further movement evidence exists.`,
      },
    };

    setMessages((prev) => [...prev, pickerMsg, escalateMsg]);
    setStage('escalated');

    const voiceText = PICKER_I18N.messages.caseEscalatedMessage(
      `Item not found at suggested location ${loc}`
    )[selectedLang];
    setActiveSpeechText(voiceText);

    onPickerVerification({
      caseId: currentScenario.caseId,
      sku: order?.sku || currentScenario.sku,
      itemName: order?.itemName || currentScenario.item,
      expectedLocation: order?.expectedBin || currentScenario.expectedLocation,
      verifiedLocation: loc,
      outcome: 'NOT_FOUND',
      notes: `Picker physically checked suggested location ${loc}; item still absent. Escalated for supervisor warehouse audit.`,
    });
  };

  // Escalate to Supervisor directly (for insufficient/conflicting/stale)
  const handleEscalateToSupervisor = (reason?: string) => {
    const escReason =
      reason || 'Insufficient or conflicting inventory movement records require supervisor inspection';
    const order = assignedTask;

    const escalateMsg: ConversationMessage = {
      id: `msg-sys-esc-direct-${Date.now()}`,
      sender: 'system',
      timestamp: getCurrentTime(),
      type: 'ESCALATED_SUMMARY',
      payload: { reason: escReason },
    };

    setMessages((prev) => [...prev, escalateMsg]);
    setStage('escalated');

    const voiceText = PICKER_I18N.messages.caseEscalatedMessage(escReason)[selectedLang];
    setActiveSpeechText(voiceText);

    onPickerVerification({
      caseId: currentScenario.caseId,
      sku: order?.sku || currentScenario.sku,
      itemName: order?.itemName || currentScenario.item,
      expectedLocation: order?.expectedBin || currentScenario.expectedLocation,
      verifiedLocation: '—',
      outcome: 'ESCALATE',
      notes: escReason,
    });
  };

  // Drawer Action: Submit Less Quantity Discrepancy
  const handleSubmitLessQuantity = () => {
    setShowLessQtyDrawer(false);
    const loc = recommendedBin || assignedTask?.expectedBin || currentScenario.expectedLocation;
    const required = assignedTask?.requiredQty || currentScenario.qty;
    const found = customFoundQty;
    const discrepancy = required - found;

    const pickerMsg: ConversationMessage = {
      id: `msg-pick-less-${Date.now()}`,
      sender: 'picker',
      timestamp: getCurrentTime(),
      type: 'PICKER_LESS_QTY',
      payload: { foundQty: found, totalQty: required },
    };

    const summaryMsg: ConversationMessage = {
      id: `msg-sys-esc-less-${Date.now() + 1}`,
      sender: 'system',
      timestamp: getCurrentTime(),
      type: 'ESCALATED_SUMMARY',
      payload: {
        reason: `Quantity shortage: ${found} found of ${required} expected (Discrepancy: ${discrepancy} units). Logged for supervisor review.`,
      },
    };

    setMessages((prev) => [...prev, pickerMsg, summaryMsg]);
    setStage('escalated');

    const voiceText = PICKER_I18N.messages.pickerReportedLessQty(found, required)[selectedLang];
    setActiveSpeechText(voiceText);

    onPickerVerification({
      caseId: currentScenario.caseId,
      sku: assignedTask?.sku || currentScenario.sku,
      itemName: assignedTask?.itemName || currentScenario.item,
      expectedLocation: assignedTask?.expectedBin || currentScenario.expectedLocation,
      verifiedLocation: loc,
      outcome: 'WRONG_QUANTITY',
      foundQuantity: found,
      notes: `Physical shortage reported: ${found} found out of ${required} expected at ${loc}. Transferred to supervisor review without modifying inventory counts.`,
    });
  };

  // Drawer Action: Submit Damaged Stock
  const handleSubmitDamage = () => {
    setShowDamageDrawer(false);
    const loc = recommendedBin || assignedTask?.expectedBin || currentScenario.expectedLocation;

    const pickerMsg: ConversationMessage = {
      id: `msg-pick-dmg-${Date.now()}`,
      sender: 'picker',
      timestamp: getCurrentTime(),
      type: 'PICKER_DAMAGED',
      payload: { damageReason: selectedDamageType },
    };

    const summaryMsg: ConversationMessage = {
      id: `msg-sys-esc-dmg-${Date.now() + 1}`,
      sender: 'system',
      timestamp: getCurrentTime(),
      type: 'ESCALATED_SUMMARY',
      payload: {
        reason: `Damaged inventory reported (${selectedDamageType}). Logged for supervisor quarantine review.`,
      },
    };

    setMessages((prev) => [...prev, pickerMsg, summaryMsg]);
    setStage('escalated');

    const voiceText = PICKER_I18N.messages.pickerReportedDamaged(selectedDamageType)[selectedLang];
    setActiveSpeechText(voiceText);

    onPickerVerification({
      caseId: currentScenario.caseId,
      sku: assignedTask?.sku || currentScenario.sku,
      itemName: assignedTask?.itemName || currentScenario.item,
      expectedLocation: assignedTask?.expectedBin || currentScenario.expectedLocation,
      verifiedLocation: loc,
      outcome: 'DAMAGED',
      notes: `Damaged stock reported: ${selectedDamageType} at ${loc}. Transferred to supervisor quarantine queue.`,
    });
  };

  // Render message text helper
  const renderMessageText = (msg: ConversationMessage, lang: PickerLang): string => {
    const p = msg.payload;
    switch (msg.type) {
      case 'PICKER_REPORT':
        return p?.customText || '';
      case 'ORDER_MATCHED_CONFIRMATION':
        return PICKER_I18N.dispatch.orderMatchedConfirmation[lang];
      case 'TASK_ASSIGNED_PROGRESS':
        return PICKER_I18N.dispatch.taskAssignedProgress[lang];
      case 'REC_SUPPORTED':
        return PICKER_I18N.messages.recommendationSupported(
          p?.fromBin || assignedTask?.expectedBin || 'the expected bin',
          p?.toBin || 'B07',
          p?.time || '14:35',
          p?.landmark || 'near the blue rack, bottom shelf'
        )[lang];
      case 'REC_INSUFFICIENT':
        return PICKER_I18N.messages.recommendationInsufficient[lang];
      case 'REC_CONFLICTING':
        return PICKER_I18N.messages.recommendationConflicting(
          p?.scannerLoc || 'B07',
          p?.scannerTime || '11:35',
          p?.cameraLoc || 'C19',
          p?.cameraTime || '11:38'
        )[lang];
      case 'REC_STALE':
        return PICKER_I18N.messages.recommendationStale(p?.staleLoc || 'D04', p?.hoursOld || 28)[lang];
      case 'REC_LESS_QTY':
        return `Dispatch order requires ${p?.totalQty ?? 10} units, but ${p?.foundQty ?? 6} units were reported. A shortage discrepancy of ${p?.discrepancy ?? 4} units has been logged for supervisor review.`;
      case 'REC_DAMAGED':
        return PICKER_I18N.messages.pickerReportedDamaged(p?.damageReason || 'Cracked packaging / Broken seal')[lang];
      case 'REC_HIGH_VALUE':
        return PICKER_I18N.messages.recommendationHighValue(p?.itemValue || 18000, p?.costInr || 120)[lang];
      case 'TIER3_COMPLETED':
        return PICKER_I18N.messages.tier3AnalysisCompleted(p?.toBin || 'E14')[lang];
      case 'PICKER_FOUND':
        return PICKER_I18N.messages.pickerFound(p?.bin || 'B07')[lang];
      case 'PICKER_NOT_FOUND_RECOMMENDED':
        return PICKER_I18N.messages.pickerNotFoundRecommended(p?.bin || 'B07')[lang];
      case 'PICKER_LESS_QTY':
        return PICKER_I18N.messages.pickerReportedLessQty(p?.foundQty || 1, p?.totalQty || 10)[lang];
      case 'PICKER_DAMAGED':
        return PICKER_I18N.messages.pickerReportedDamaged(p?.damageReason || 'Cracked packaging')[lang];
      case 'RESOLVED_SUMMARY':
        return PICKER_I18N.messages.caseResolvedMessage(p?.bin || 'B07')[lang];
      case 'ESCALATED_SUMMARY':
        return PICKER_I18N.messages.caseEscalatedMessage(p?.reason || 'Under supervisor review')[lang];
      default:
        return '';
    }
  };

  const vLabels = PICKER_I18N.verificationButtons;

  return (
    <div className="w-full flex flex-col items-center justify-start pb-12 px-2 sm:px-4">
      {/* =================================================================== */}
      {/* 1. DEMO SCENARIO SELECTOR (SIMULATED DEMO DATA) */}
      {/* =================================================================== */}
      <div className="w-full max-w-md mb-2 bg-white rounded-xl border border-slate-200 p-2 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-800 text-[11px]">
              {PICKER_I18N.header.demoSelectorLabel[selectedLang]}
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono border border-slate-200">
              {PICKER_I18N.header.simulatedBadge[selectedLang]}
            </span>
          </div>

          <button
            id="picker-btn-reset-demo"
            onClick={handleResetCurrentDemo}
            className="text-slate-500 hover:text-slate-900 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
            title="Reset active scenario demo"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>{vLabels.reset[selectedLang]}</span>
          </button>
        </div>

        {/* 8 Clickable Scenario Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
          {DEMO_SCENARIOS.map((sc) => {
            const isSelected = sc.id === selectedScenarioId;
            return (
              <button
                key={sc.id}
                id={`demo-scenario-btn-${sc.scenarioNumber}`}
                onClick={() => handleSelectScenario(sc.id)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-tight transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title={sc.title}
              >
                <span>{sc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. MOBILE CARD: CONVERSATIONAL PICKER TERMINAL */}
      {/* =================================================================== */}
      <div
        id="picker-mobile-container"
        className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col"
      >
        {/* Dark Green StockTrace Header */}
        <div className="bg-emerald-900 text-white px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-100">
              ST
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
                <span>{PICKER_I18N.header.terminalTitle[selectedLang]}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-xs font-semibold text-white truncate max-w-[210px]">
                {stage === 'welcome' || !assignedTask
                  ? 'Warehouse Dispatch Intelligence'
                  : `${assignedTask.orderId} • Bin ${assignedTask.expectedBin}`}
              </div>
            </div>
          </div>

          <div className="text-right flex items-center space-x-1.5">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                stage === 'resolved'
                  ? 'bg-emerald-800 text-emerald-100 border-emerald-600'
                  : stage === 'escalated'
                  ? 'bg-rose-900/90 text-rose-200 border-rose-700'
                  : stage === 'investigating'
                  ? 'bg-emerald-800/80 text-emerald-200 border-emerald-700'
                  : stage === 'recommendation_active'
                  ? 'bg-teal-800 text-teal-200 border-teal-600'
                  : 'bg-emerald-800/60 text-emerald-200 border-emerald-700'
              }`}
            >
              {stage === 'resolved'
                ? 'RESOLVED'
                : stage === 'escalated'
                ? 'ESCALATED'
                : stage === 'investigating'
                ? 'INVESTIGATING'
                : stage === 'recommendation_active'
                ? 'CHECKING BIN'
                : 'READY'}
            </span>
          </div>
        </div>

        {/* Multilingual Selector Strip */}
        <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600 text-[11px] font-medium">Language:</span>
          <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 shadow-2xs">
            <button
              id="picker-lang-en"
              onClick={() => setSelectedLang('en')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                selectedLang === 'en'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              id="picker-lang-hi"
              onClick={() => setSelectedLang('hi')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                selectedLang === 'hi'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिंदी
            </button>
            <button
              id="picker-lang-kn"
              onClick={() => setSelectedLang('kn')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                selectedLang === 'kn'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. INITIAL WELCOME SCREEN (Section 2 Requirements) */}
        {/* Do not initially display: Task ID, Order ID, SKU, product, qty, expected bin, alternate loc */}
        {/* =================================================================== */}
        {stage === 'welcome' && (
          <div className="p-4 sm:p-5 space-y-4 bg-white flex-1 flex flex-col justify-start">
            {/* Opening Welcome Bubble from StockTrace */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                  ST
                </div>
                <span>StockTrace Assistant</span>
              </div>
              <p
                id="picker-opening-message"
                className="text-sm font-semibold text-slate-900 leading-relaxed"
              >
                {PICKER_I18N.welcome.openingMessage[selectedLang]}
              </p>
            </div>

            {/* Prominent Microphone Button: Report a Missing Item */}
            <div className="space-y-1.5 flex flex-col items-center">
              <button
                id="picker-btn-report-missing"
                onClick={handleToggleSpeechRecognition}
                className={`w-full min-h-[56px] rounded-xl text-sm font-bold flex items-center justify-center space-x-2.5 shadow-md cursor-pointer transition-all active:scale-[0.99] ${
                  isRecordingSpeech
                    ? 'bg-rose-700 text-white ring-4 ring-rose-200 animate-pulse'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {isRecordingSpeech ? (
                  <>
                    <Mic className="w-5 h-5 text-white animate-bounce" />
                    <span>{PICKER_I18N.voiceModal.listeningNow[selectedLang]}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 text-rose-100" />
                    <span>{PICKER_I18N.welcome.reportMissingBtn[selectedLang]}</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-500 font-medium">
                {isRecordingSpeech
                  ? 'Listening to microphone... Speak clearly'
                  : 'Tap to speak via microphone, or type your report below'}
              </span>

              {speechError && (
                <div className="text-[11px] text-rose-600 text-center font-medium bg-rose-50 border border-rose-200 rounded-lg p-2 w-full">
                  {speechError}
                </div>
              )}
            </div>

            {/* Fallback Text Input & Send Button */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  id="picker-report-input"
                  type="text"
                  value={reportInputText}
                  onChange={(e) => setReportInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && reportInputText.trim()) {
                      handleSubmitReport(reportInputText);
                    }
                  }}
                  placeholder={PICKER_I18N.welcome.textFallbackPlaceholder[selectedLang]}
                  className="flex-1 text-xs p-3 rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-slate-900 font-medium bg-slate-50 shadow-2xs"
                />
                <button
                  id="picker-btn-send-report"
                  onClick={() => handleSubmitReport(reportInputText)}
                  disabled={!reportInputText.trim()}
                  className="h-11 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{PICKER_I18N.welcome.sendButton[selectedLang]}</span>
                </button>
              </div>
            </div>

            {/* Common Picker Report Example Chips (Section 3) */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {PICKER_I18N.welcome.quickExamplesLabel[selectedLang]}
              </span>
              <div className="flex flex-col gap-1.5">
                {PICKER_I18N.welcome.examples.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      setReportInputText(ex.text[selectedLang]);
                      handleSubmitReport(ex.text[selectedLang]);
                    }}
                    className="text-[11px] text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg p-2 text-left transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <span>{ex.text[selectedLang]}</span>
                    <Send className="w-3 h-3 text-slate-400 group-hover:text-slate-800 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 4. CONVERSATION STREAM (Only after picker reports a problem) */}
        {/* =================================================================== */}
        {stage !== 'welcome' && (
          <>
            <div
              id="picker-chat-history"
              className="flex-1 p-3 sm:p-4 space-y-3 min-h-[300px] max-h-[460px] overflow-y-auto bg-slate-50/50"
            >
              {messages.map((msg) => {
                const isSystem = msg.sender === 'system';
                const textContent = renderMessageText(msg, selectedLang);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSystem ? 'items-start' : 'items-end'} space-y-1 animate-in fade-in`}
                  >
                    <div
                      className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs ${
                        isSystem
                          ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                          : 'bg-emerald-600 text-white rounded-tr-xs font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between space-x-2 mb-1 text-[10px] opacity-70">
                        <span className="font-semibold">
                          {isSystem ? 'StockTrace Assistant' : 'You (Picker)'}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {textContent && <p className="leading-relaxed text-[12px]">{textContent}</p>}

                      {/* Matched Dispatch Order & Assigned Task Card (Section 4 Requirements) */}
                      {msg.type === 'ORDER_MATCHED_CONFIRMATION' && msg.payload && (
                        <div
                          id="picker-assigned-task-card"
                          className="mt-2.5 p-3 rounded-xl bg-slate-900 text-slate-100 space-y-2 border border-slate-800 shadow-xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[10px]">
                            <div className="flex items-center space-x-1.5 font-mono text-emerald-400 font-bold">
                              <FileText className="w-3.5 h-3.5" />
                              <span>{msg.payload.taskId}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {msg.payload.traceId && (
                                <span className="text-[9px] text-slate-400 font-mono">
                                  Trace: {msg.payload.traceId.slice(0, 14)}
                                </span>
                              )}
                              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded font-mono font-bold">
                                {msg.payload.orderId}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span>{msg.payload.item}</span>
                              <span className="font-mono text-slate-300 text-[11px]">{msg.payload.sku}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                              <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                                <span className="text-[10px] text-slate-400 block">Required by Order:</span>
                                <strong className="text-white text-sm font-black">{msg.payload.qty} units</strong>
                              </div>
                              <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                                <span className="text-[10px] text-slate-400 block">Expected Bin:</span>
                                <strong className="text-emerald-300 text-sm font-black font-mono">
                                  {msg.payload.bin}
                                </strong>
                              </div>
                            </div>

                            {msg.payload.landmark && (
                              <div className="text-[10px] text-slate-300 pt-1 flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{msg.payload.landmark}</span>
                              </div>
                            )}

                            {msg.payload.reportedQty !== undefined && (
                              <div className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/60 p-1.5 rounded mt-1">
                                Reported Available: <strong>{msg.payload.reportedQty}</strong> &bull; Calculated Shortage: <strong>{msg.payload.discrepancy} units</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Evidence Card: Supported Alternate Location (B07) */}
                      {msg.type === 'REC_SUPPORTED' && msg.payload && (
                        <div
                          id="recommendation-card-supported"
                          className="mt-2.5 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5 font-mono font-black text-teal-900 text-sm">
                              <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
                              <span>Suggested Bin: {msg.payload.toBin || 'B07'}</span>
                            </div>
                            <span className="text-[10px] font-bold bg-teal-200/60 text-teal-900 px-2 py-0.5 rounded-full">
                              Tier 1 Corroborated
                            </span>
                          </div>

                          <div className="text-[11px] text-teal-900 font-medium">
                            {assignedTask?.locationDescription || 'Near the blue rack, bottom shelf (Level 1)'}
                          </div>

                          <div className="pt-1.5 border-t border-teal-200/60 space-y-1 text-[10px] text-teal-800">
                            <div className="flex justify-between">
                              <span className="font-semibold">Evidence Source:</span>
                              <span>Scanner Transfer &bull; 14:35</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold">Visual Confirmation:</span>
                              <span>Aisle 3 camera cart transit</span>
                            </div>
                            <div className="flex justify-between font-semibold text-teal-950">
                              <span>Evidence Status:</span>
                              <span>Awaiting physical verification</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Evidence Card: Insufficient Evidence */}
                      {msg.type === 'REC_INSUFFICIENT' && (
                        <div
                          id="recommendation-card-insufficient"
                          className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5"
                        >
                          <div className="flex items-center space-x-1.5 font-bold text-amber-900 text-xs">
                            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>No Location Recommended</span>
                          </div>
                          <p className="text-[11px] text-amber-900 leading-snug">
                            No movement recorded after put-away. StockTrace refuses to guess unverified locations without grounded evidence.
                          </p>
                        </div>
                      )}

                      {/* Evidence Card: Conflicting Evidence */}
                      {msg.type === 'REC_CONFLICTING' && msg.payload && (
                        <div
                          id="recommendation-card-conflicting"
                          className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5"
                        >
                          <div className="flex items-center space-x-1.5 font-bold text-rose-900 text-xs">
                            <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                            <span>Conflicting Movement Signals</span>
                          </div>
                          <div className="text-[10px] space-y-1 pt-1 border-t border-rose-200/60 text-rose-900">
                            <div>
                              <strong>Scanner 03:</strong> Logged transfer to{' '}
                              <span className="font-mono font-bold">B07</span> at 11:35
                            </div>
                            <div>
                              <strong>Camera CAM-07:</strong> Observed tote moving toward{' '}
                              <span className="font-mono font-bold">C19</span> at 11:38
                            </div>
                            <div className="text-[10px] text-rose-700 italic pt-0.5">
                              Rule 6 enforced: Neither location recommended without supervisor physical inspection.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Evidence Card: Stale Evidence */}
                      {msg.type === 'REC_STALE' && msg.payload && (
                        <div
                          id="recommendation-card-stale"
                          className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5"
                        >
                          <div className="flex items-center space-x-1.5 font-bold text-amber-900 text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>Stale Movement Record (28 Hours Old)</span>
                          </div>
                          <p className="text-[11px] text-amber-900 leading-snug">
                            Historical scan shows relocation toward{' '}
                            <span className="font-mono font-bold">D04</span>, but age exceeds 2-hour threshold.
                            Cannot be verified as current proof of physical presence.
                          </p>
                        </div>
                      )}

                      {/* Evidence Card: Less Quantity */}
                      {msg.type === 'REC_LESS_QTY' && msg.payload && (
                        <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5">
                          <div className="flex items-center space-x-1.5 font-bold text-amber-900 text-xs">
                            <Package className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>Shortage Discrepancy Logged</span>
                          </div>
                          <p className="text-[11px] text-amber-900 leading-snug">
                            Picker found {msg.payload.foundQty} units out of {msg.payload.totalQty} required. Shortage discrepancy logged for supervisor review. No automated inventory change applied.
                          </p>
                        </div>
                      )}

                      {/* Evidence Card: Damaged Stock */}
                      {msg.type === 'REC_DAMAGED' && msg.payload && (
                        <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
                          <div className="flex items-center space-x-1.5 font-bold text-rose-900 text-xs">
                            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                            <span>Damaged Inventory Exception</span>
                          </div>
                          <p className="text-[11px] text-rose-900 leading-snug">
                            Reported condition: <strong>{msg.payload.damageReason}</strong>. Transferred to supervisor quarantine inspection queue.
                          </p>
                        </div>
                      )}

                      {/* Evidence Card: High-Value (Tier 3 AI) */}
                      {msg.type === 'REC_HIGH_VALUE' && msg.payload && (
                        <div className="mt-2.5 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 space-y-2">
                          <div className="flex items-center space-x-1.5 font-bold text-purple-900 text-xs">
                            <Cpu className="w-4 h-4 text-purple-700 shrink-0" />
                            <span>High-Value Exception &bull; Tier 3 Eligible</span>
                          </div>
                          <p className="text-[11px] text-purple-900 leading-snug">
                            Item value ₹{(msg.payload.itemValue || 18000).toLocaleString('en-IN')} meets ₹5,000 threshold.
                            Tier 1 scanner records inconclusive. Simulated Tier 3 AI video frame analysis available (~₹120 cost).
                          </p>

                          {!tier3Completed && (
                            <button
                              id="btn-run-tier3-ai"
                              onClick={handleRunTier3Simulated}
                              disabled={isTier3Running}
                              className="w-full mt-1 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-2xs transition-colors"
                            >
                              {isTier3Running ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>{vLabels.runningTier3[selectedLang]}</span>
                                </>
                              ) : (
                                <>
                                  <Cpu className="w-3.5 h-3.5" />
                                  <span>{vLabels.runTier3Ai[selectedLang]}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Evidence Card: Tier 3 Completed */}
                      {msg.type === 'TIER3_COMPLETED' && msg.payload && (
                        <div className="mt-2.5 p-3 rounded-xl bg-slate-900 text-slate-100 space-y-2 border border-slate-800">
                          <div className="flex items-center justify-between text-[11px] font-mono text-purple-400">
                            <span>CCTV FRAME MATCH &bull; CONFIDENCE 94%</span>
                            <span className="text-emerald-400">ANALYSIS COMPLETE</span>
                          </div>
                          <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                            <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                            <span>Detected Location: Bay {msg.payload.toBin || 'E14'}</span>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Frame 05:58:32: Visual recognition confirmed manufacturer seal match placed into Bay E14 bottom shelf.
                          </p>
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                            Illustrative compute cost ₹120 logged. Physical confirmation mandatory.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Investigation Progress Spinner */}
              {stage === 'investigating' && (
                <div className="flex flex-col items-start space-y-1 animate-in fade-in">
                  <div className="max-w-[90%] bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs shadow-2xs flex items-center space-x-2 text-slate-700">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
                    <span className="font-medium text-[11px]">
                      {PICKER_I18N.dispatch.taskAssignedProgress[selectedLang]}
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Working TTS Button */}
            {activeSpeechText && (
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
                <button
                  id="picker-btn-listen-instruction"
                  onClick={() => handlePlayVoice()}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border transition-colors cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                  }`}
                  aria-label="Listen to instruction in active language"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />
                  <span>
                    {isPlayingAudio
                      ? vLabels.listening[selectedLang]
                      : `${vLabels.listenInstruction[selectedLang]} (${selectedLang.toUpperCase()})`}
                  </span>
                </button>
              </div>
            )}
          </>
        )}

        {/* =================================================================== */}
        {/* 5. VERIFICATION BUTTONS (Only after StockTrace responds) */}
        {/* =================================================================== */}
        {stage === 'recommendation_active' && (
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 space-y-2">
            {(recommendedBin || tier3Completed) && (
              <>
                <div className="text-[11px] font-bold text-teal-800 text-center">
                  {PICKER_I18N.messages.verificationPrompt(recommendedBin || 'B07')[selectedLang]}
                </div>

                {/* 4 Verification Buttons: Found Here, Still Not Found, Less Qty, Damaged */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="picker-btn-found-here"
                    onClick={handleFoundHere}
                    className="min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-2xs cursor-pointer transition-transform active:scale-[0.98]"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{vLabels.foundHere[selectedLang]}</span>
                  </button>

                  <button
                    id="picker-btn-still-not-found"
                    onClick={handleStillNotFound}
                    className="min-h-[48px] bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-2xs cursor-pointer transition-transform active:scale-[0.98]"
                  >
                    <Search className="w-4 h-4 stroke-[2.5]" />
                    <span>{vLabels.stillNotFound[selectedLang]}</span>
                  </button>

                  <button
                    id="picker-btn-less-qty-rec"
                    onClick={() => {
                      setShowLessQtyDrawer(!showLessQtyDrawer);
                      setShowDamageDrawer(false);
                    }}
                    className="min-h-[42px] bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{vLabels.lessQty[selectedLang]}</span>
                  </button>

                  <button
                    id="picker-btn-damaged-rec"
                    onClick={() => {
                      setShowDamageDrawer(!showDamageDrawer);
                      setShowLessQtyDrawer(false);
                    }}
                    className="min-h-[42px] bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{vLabels.damaged[selectedLang]}</span>
                  </button>
                </div>
              </>
            )}

            {!recommendedBin && !tier3Completed && (
              <div className="space-y-2">
                <button
                  id="picker-btn-escalate-supervisor"
                  onClick={() => handleEscalateToSupervisor()}
                  className="w-full min-h-[48px] bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-2xs cursor-pointer transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{vLabels.escalateSupervisor[selectedLang]}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Completion State (Resolved / Escalated) */}
        {(stage === 'resolved' || stage === 'escalated') && (
          <div className="p-4 bg-white border-t border-slate-200 space-y-2 text-center">
            <div
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 ${
                stage === 'resolved'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {stage === 'resolved' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>
                {stage === 'resolved'
                  ? `Case Resolved at ${recommendedBin || assignedTask?.expectedBin || 'assigned bin'}`
                  : 'Escalated to Warehouse Supervisor'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="picker-btn-switch-supervisor"
                onClick={() => onSwitchToSupervisor(currentScenario.caseId)}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
              >
                <span>Supervisor Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                id="picker-btn-reset-after-complete"
                onClick={handleResetCurrentDemo}
                className="py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Restart Demo</span>
              </button>
            </div>
          </div>
        )}

        {/* Inline Drawer A: Less Quantity Input */}
        {showLessQtyDrawer && (
          <div className="p-3 bg-slate-100 border-t border-slate-200 space-y-2 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <div className="flex items-center space-x-1.5">
                <Package className="w-4 h-4 text-slate-600" />
                <span>{PICKER_I18N.drawers.lessQtyTitle[selectedLang]}</span>
              </div>
              <button
                onClick={() => setShowLessQtyDrawer(false)}
                className="text-slate-500 hover:text-slate-800 text-[11px] cursor-pointer"
              >
                {vLabels.cancel[selectedLang]}
              </button>
            </div>

            <p className="text-[11px] text-slate-600">
              {PICKER_I18N.drawers.lessQtyPrompt(assignedTask?.requiredQty || currentScenario.qty)[selectedLang]}
            </p>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCustomFoundQty((prev) => Math.max(1, prev - 1))}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold text-base flex items-center justify-center cursor-pointer hover:bg-slate-50"
              >
                -
              </button>
              <div className="flex-1 text-center font-mono font-bold text-lg bg-white border border-slate-300 rounded-lg py-1">
                {customFoundQty} / {assignedTask?.requiredQty || currentScenario.qty}
              </div>
              <button
                onClick={() => setCustomFoundQty((prev) => Math.min((assignedTask?.requiredQty || currentScenario.qty) - 1, prev + 1))}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold text-base flex items-center justify-center cursor-pointer hover:bg-slate-50"
              >
                +
              </button>
            </div>

            <button
              id="btn-submit-less-qty"
              onClick={handleSubmitLessQuantity}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              {vLabels.submitDiscrepancy[selectedLang]}
            </button>
          </div>
        )}

        {/* Inline Drawer B: Damaged Item Condition Selection */}
        {showDamageDrawer && (
          <div className="p-3 bg-slate-100 border-t border-slate-200 space-y-2 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <div className="flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{PICKER_I18N.drawers.damageTitle[selectedLang]}</span>
              </div>
              <button
                onClick={() => setShowDamageDrawer(false)}
                className="text-slate-500 hover:text-slate-800 text-[11px] cursor-pointer"
              >
                {vLabels.cancel[selectedLang]}
              </button>
            </div>

            <p className="text-[11px] text-slate-600">
              {PICKER_I18N.drawers.damagePrompt[selectedLang]}
            </p>

            <div className="space-y-1">
              {PICKER_I18N.drawers.damageOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedDamageType === opt.label.en
                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="damageType"
                    checked={selectedDamageType === opt.label.en}
                    onChange={() => setSelectedDamageType(opt.label.en)}
                    className="text-amber-600"
                  />
                  <span>{opt.label[selectedLang]}</span>
                </label>
              ))}
            </div>

            <button
              id="btn-submit-damage"
              onClick={handleSubmitDamage}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              {vLabels.submitDamage[selectedLang]}
            </button>
          </div>
        )}

        {/* Footer Attribution */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Dispatch-Driven Experience</span>
          <span className="font-semibold text-slate-500">StockTrace recommends. Humans verify.</span>
        </div>
      </div>
    </div>
  );
};
